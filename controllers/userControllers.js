const User = require("../models/User.js");
const Product = require("../models/Product.js")
const bcrypt = require("bcryptjs");
const auth = require("../auth.js");

/*
	Check if the user already exists by checking:
	1. If the email is already registered
	2. If the username is already taken;
	3. And if both email and username is already taken
*/
module.exports.checkUserExists = async (request, response, next) => {
  try {
    const emailExists = await User.exists({ email: request.body.email });
    const usernameExists = await User.exists({ username: request.body.username });

    if (emailExists) {
    	return response.send(false);
    } 

    if (usernameExists) {
    	return response.send(false);
    } 

    next();
  } catch (error) {
    response.send(false);
  }
};

/*
	Register user to the database by:
	1. Creating a new instance of a user and providing its required properties
	2. Hashing the password of the user using bcrypt
	3. Saving the new instance of the user to the database
*/
module.exports.register = (request, response) => {
	let reqBody = request.body;

	const newUser = new User({
		firstName: reqBody.firstName,
		lastName: reqBody.lastName,
		username: reqBody.username,
		email: reqBody.email,
		password: bcrypt.hashSync(reqBody.password, 10),
		mobileNumber: reqBody.mobileNumber,
		cart: {
			products: [],
		  totalAmount: 0,
		}
	});

	newUser.save().then(save => {
		return response.send(true)
	}).catch(error => {
		return response.send(false)
	})
}

/*
	Users should logged in by:
	1. Check the database if the user email exists
    2. Compare the password provided in the login form with the password stored in the database
    3. Generate/return a JSON web token if the user is successfully logged in and return false if not
*/
module.exports.login = (request, response) => {
	User.findOne({email: request.body.email}).then(result => {
		if(result === null) {
			return response.send(false)
		} else {
			const isPasswordCorrect = bcrypt.compareSync(request.body.password, result.password);

			if(isPasswordCorrect) {
				const token = auth.createAccessToken(result)

				return response.send({accessToken: token})
			} else {
				return response.send(false)
			}
		}
	})
}

module.exports.getDetails = (request, response) => {
	let user = request.user;

	User.findById(user.id).then(result => {
		result.password = ""
		return response.send(result)
	}).catch(error => response.send(false))
}

/*
	User checkout
*/
module.exports.checkout = async (request, response) => {
  try {
    const reqBody = request.body;
    const user = request.user;

    // Update user's address
    const newAddress = {
      address: {
        blkLot: reqBody.blkLot,
        street: reqBody.street,
        city: reqBody.city,
        province: reqBody.province,
        zipCode: reqBody.zipCode,
        country: reqBody.country,
      },
    };

    const isAddressUpdated = await User.findByIdAndUpdate(user.id, newAddress).then(
      (result) => true
    ).catch((error) => false);

    if (!isAddressUpdated) {
      return response.send(false);
    }

    // Process each product in the cart
    for (const productData of reqBody.products) {
      const { productId, quantity } = productData;

      // Fetch the product details
      const checkedOutProduct = await Product.findById(productId);

      if (!checkedOutProduct) {
        return response.status(404).json(false);
      }

      // Create an order for the product
      const newOrderProduct = {
        products: [
          {
            productId: productId,
            productName: checkedOutProduct.productName,
            quantity: quantity,
          },
        ],
        subTotal: 0,
        totalAmount: 0,
        paymentMethod: reqBody.paymentMethod,
      };

      newOrderProduct.totalAmount =
        newOrderProduct.subTotal +
        newOrderProduct.products.reduce((sum, product) => {
          return sum + product.quantity * checkedOutProduct.price;
        }, 0);

      newOrderProduct.subTotal = newOrderProduct.totalAmount;

      // Update user's ordered products
      user.orderedProduct.push(newOrderProduct);

      // Update product stocks and sold count
      const newStockSoldView = {
        stocks: checkedOutProduct.stocks,
        sold: checkedOutProduct.sold,
      };

      newStockSoldView.stocks -= quantity;
      newStockSoldView.sold += quantity;

      // Save changes to user and product
      await user.save();
      await Product.findByIdAndUpdate(productId, newStockSoldView);

      // Add the user to the product's userOrders array
      const newUserToOrder = {
        userId: user.id,
      };
      checkedOutProduct.userOrders.push(newUserToOrder);

      await checkedOutProduct.save();
    }

    return response.json(true);
  } catch (error) {
    return response.status(500).json(false);
  }
};


// Handle checkout for multiple products
module.exports.checkoutCart = async (req, res) => {
  try {
    const { address, paymentMethod, products } = req.body;
    const userId = req.user.id;

    // Update user's address
    const updatedUser = await User.findByIdAndUpdate(userId, { address }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Process each product in the cart
    for (const productData of products) {
      const { productId, quantity } = productData;

      // Fetch the product details
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ success: false, message: `Product with ID ${productId} not found` });
      }

      // Check if there are enough stocks
      if (product.stocks < quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stocks for product ${product.productName}` });
      }

      // Create an order for the product
      const orderProduct = {
        productId,
        productName: product.productName,
        quantity,
        subTotal: product.price * quantity,
      };

      // Update user's ordered products
      updatedUser.orderedProducts.push(orderProduct);

      // Update product stocks and sold count
      product.stocks -= quantity;
      product.sold += quantity;

      // Save the changes
      await updatedUser.save();
      await product.save();
    }

    return res.json({ success: true, message: 'Checkout successful' });
  } catch (error) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/*
	Get User Details:
	1. Make the userId as params
	2. Pass the userId to the findById query param
	3. Hide the password 
*/
module.exports.getProfile = (request, response) => {
	let userId = request.params.userId;

	User.findById(userId).then(result => {
		result.password = ""
		return response.send(result)
	}).catch(error => response.send(false))
}

/*
	Update a user to admin role:
	1. Get the id in req body
	2. Pass the userId and the object in the findByIdAndUpdate query params
	3. Set the role to admin
*/
module.exports.updateToAdmin = (request, response) => {
	let reqBody = request.body;

	let newUserRole = {
		role: reqBody.role
	}

	User.findByIdAndUpdate(reqBody.userId, newUserRole).then(result => {
		return response.send(`${result.username} is now an Admin.`)
	}).catch(error => response.send("Error occured."))
}

/*
	Update user information
*/
module.exports.updateProfile = (request, response) => {
	let reqBody = request.body;
	let userId = request.user.id;

	let newUserProfile = {
		firstName: reqBody.firstName,
		lastName: reqBody.lastName,
		mobileNumber: reqBody.mobileNumber,
		address: {
			blkLot: reqBody.blkLot,
			street: reqBody.street,
			city: reqBody.city,
			province: reqBody.province,
			zipCode: reqBody.zipCode,
			country: reqBody.country
		}
	}

	User.findByIdAndUpdate(userId, newUserProfile).then(result => {
		return response.send(true)
	}).catch(error => {
		return response.send(false)
	})
}


module.exports.resetPassword = (request, response) => {
	const reqBody = request.body;
	const userId = request.user.id;

	User.findById(userId).then(result => {
		const hashedPassword = bcrypt.hashSync(reqBody.newPassword, 10);

		const isPasswordSame = bcrypt.compareSync(reqBody.newPassword, result.password);

		if (!isPasswordSame && reqBody.newPassword === reqBody.confirmNewPassword) {

			result.password = hashedPassword;

			return result.save().then(saved => {
				return response.send(true)
			}).catch(error => false);
		} else {
			return response.send(false);
		}
	}).catch(error => false)
}

/*
	Retrieve user orders, authenticated users only
*/
module.exports.retrieveUserOrders = (request, response) => {
	let userId = request.user.id;

	User.findById(userId).then(result => {
		return response.send({userOrders: result.orderedProduct});
	}).catch(error => response.send("Error retrieving orders"))
}

/*
	Retrieve all users orders, admins only
*/
module.exports.retrieveAllUserOrders = (request, response) => {
	User.aggregate([
        { $unwind: "$orderedProduct" }, // Unwind the orderedProduct array
        { $unwind: "$orderedProduct.products" }, // Unwind the products array within orderedProduct
        {
            $project: {
                _id: 0, // Exclude the document ID
                productId: "$orderedProduct.products.productId",
                productName: "$orderedProduct.products.productName",
                quantity: "$orderedProduct.products.quantity",
                subTotal: "$orderedProduct.subTotal",
                totalAmount: "$orderedProduct.totalAmount",
                paymentMethod: "$orderedProduct.paymentMethod",
                status: "$orderedProduct.status",
                purchasedOn: "$orderedProduct.purchasedOn",
                deliveredOn: "$orderedProduct.deliveredOn",
            },
        },
    ]).then(result => {
        return response.send(result);
    }).catch(error => response.send("Error retrieving orders"));
}

/*
	Add to cart
	1. Pass the user's id to the findById query params
	2. Pass the productId params to the findById query params 
	3. Contain an object inside a variable with its required properties
	4. Push the object to the user's cart
	5. Save the result to the db
*/
module.exports.addToCart = async (request, response) => {
	try{
		let reqBody = request.body
		let productId = request.params.productId;
		let userId = request.user.id;
		let selectedProduct = await Product.findById(productId);

		let isUserCartUpdated = await User.findById(userId).then(result => {
			let productToBeAdded = {
				productId: productId,
				productName: selectedProduct.productName,
				image: reqBody.image,
				price: selectedProduct.price,
				quantity: reqBody.quantity,
				subTotal: 0,
			}
			productToBeAdded.subTotal = productToBeAdded.price * productToBeAdded.quantity;

			result.cart.products.push(productToBeAdded);

			result.cart.totalAmount = result.cart.products.reduce((sum, product) => sum + product.subTotal, 0);

			return result.save().then(saved => true).catch(error => false)
		})

		if(isUserCartUpdated) {
			return response.send(true);
		}
	} catch (error) {
			return response.send(error);
	}
}

/*
	Retrieve users cart products
*/
module.exports.retrieveCartProducts = async (request, response) => {
	try {
			let userId = request.user.id;
			let user = await User.findById(userId).then(result => {
				return result.cart;
			})

			response.send(user);

		} catch (error) {
				return response.status(500).send({ message: 'Internal Server Error', error });
		}
}

/*
	Change the product quantity inside a user cart
*/
module.exports.changeQuantity = (request, response) => {
	let reqBody = request.body;
	let userId = request.user.id;
	User.findById(userId).then(result => {
		let productToUpdate = result.cart.products[reqBody.productNo];

		productToUpdate.quantity = reqBody.quantity;
		productToUpdate.subTotal = reqBody.quantity * productToUpdate.price;

		result.cart.totalAmount = result.cart.products.reduce((sum, product) => sum + product.subTotal, 0);

		result.save().then(result => response.send(`${productToUpdate.productName}'s quantity is successfully updated.`)).catch(error => response.send(error));
	})
}

/*
	Remove a product from cart
*/
module.exports.removeFromCart = async (request, response) => {
  try {
    const userId = request.user.id;
    const productIdToRemove = request.params.productId;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { 'cart.products': { _id: productIdToRemove } }
      },
      { new: true }
    );

    if (!updatedUser) {
      return response.status(404).send(false);
    }

    // Recalculate totalAmount after removing the product
    const totalAmount = updatedUser.cart.products.reduce((sum, product) => sum + product.subTotal, 0);
    updatedUser.cart.totalAmount = totalAmount;

    // Save the updated user
    await updatedUser.save();

    response.send(true);
  } catch (error) {
    response.status(500).send(false);
  }
};

exports.updateCart = async (req, res) => {
  const userId = req.user.id; // Assuming you have the user ID available in the request

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json(false);
    }

    user.cart.products = req.body.products;
    user.cart.totalAmount = req.body.totalAmount;

    await user.save();

    res.status(200).json(true);
  } catch (error) {
    console.error(error);
    res.status(500).json(false);
  }
};