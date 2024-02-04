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
	User checkout: 
	1. Contain the user from the request.user and body from request.body
	2. Make a checkedOutProduct variable to contain the product to be checkout
	3. Make the productId as params and pass it to find query params
	4. Make a isUserUpdated variable to perform an update on user product. Push the newOrderProduct to the orderProductSave the product and return a boolean value
*/
module.exports.checkout = async (request, response) => {
	let reqBody = request.body;
	let user = request.user;
	const checkedOutProduct = await Product.findById(request.params.productId);

	let isUserUpdated = await User.findById(user.id).then(result => {
		let newOrderProduct = {
			products: [
				{
					productId: request.params.productId,
					productName: checkedOutProduct.productName,
					quantity: reqBody.quantity
				}
			],
			subTotal: 0,
			totalAmount: 0,
			paymentMethod: reqBody.paymentMethod,
		}

		newOrderProduct.totalAmount = newOrderProduct.subTotal + newOrderProduct.products.reduce((sum, product) => {
        return sum + (product.quantity * checkedOutProduct.price);
    }, 0);

    newOrderProduct.subTotal = newOrderProduct.totalAmount;

		result.orderedProduct.push(newOrderProduct);

		let newAddress = {
				address: {
					blkLot: reqBody.blkLot,
					street: reqBody.street,
					city: reqBody.city,
					province: reqBody.province,
					zipCode: reqBody.zipCode,
					country: reqBody.country
				}
			}

		User.findByIdAndUpdate(userId, newAddress).then(result => {
			true
			}).catch(error => false)

		return result.save().then(saved => true).catch(error => false);
	})

	if(isUserUpdated !== true) {
		return response.send(false);
	}

	let isProductUpdated = await Product.findById(request.params.productId).then(result => {
		let newUserToOrder = {
			userId: user.id
		}

		result.userOrders.push(newUserToOrder);

		let newStockSoldView = {
			stocks: checkedOutProduct.stocks,
			sold: checkedOutProduct.sold
		}

		newStockSoldView.stocks -= reqBody.quantity;
		newStockSoldView.sold += reqBody.quantity;

		Product.findByIdAndUpdate(request.params.productId, newStockSoldView).then(result => {
			true
			}).catch(error => false)

		return result.save().then(saved => true).catch(error => false);
	})

	if(isProductUpdated !== true) {
		return response.send(false)
	}

	if(isUserUpdated && isProductUpdated) {
		return response.send(true)
	}
}

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
		return response.send(`${result.username}'s profile is successfully updated.`)
	}).catch(error => response.send("Failed to update profile."))
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
        $pull: { 'cart.products': { productId: productIdToRemove } }
      },
      { new: true }
    );

    if (!updatedUser) {
      return response.status(404).send('User not found');
    }

    // Recalculate totalAmount after removing the product
    const totalAmount = updatedUser.cart.products.reduce((sum, product) => sum + product.subTotal, 0);
    updatedUser.cart.totalAmount = totalAmount;

    // Save the updated user
    await updatedUser.save();

    response.send(updatedUser.cart);
  } catch (error) {
    response.status(500).send('Internal Server Error');
  }
};