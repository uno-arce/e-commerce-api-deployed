const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	firstName: {
		type: String,
		required: [true, "First Name is required!"]
	},
	lastName: {
		type: String,
		required: [true, "Last Name is required!"]
	},
	username: {
		type: String,
		required: [true, "Username is required!"]
	},
	email: {
		type: String,
		required: [true, "Email is required!"]
	},
	password: {
		type: String,
		required: [true, "Password is required!"]
	},
	mobileNumber: {
		type: String,
		required: [true, "Mobile Number is required!"]
	},
	role: {
		type: String,
		enum: ["Admin", "User"],
		default: "User"
	},
	address: {
		blkLot: {
			type: String,
			default: null
		},
		street: {
			type: String,
			default: null
		},
		city: {
			type: String,
			default: null
		},
		province: {
			type: String,
			default: null
		},
		zipCode: {
			type: String,
			default: null
		},
		country: {
			type: String,
			default: null
		}
	},
	cart: {
		products: [
			{
				productId: {
					type: String,
					required: [true, "Product Id is required!"]
				},
				productName: {
					type: String,
					required: [true, "Product Name is required!"]
				},
				image: {
					type: String,
					required: [true, "Image is required!"]
				},
				price: {
					type: Number,
					required: [true, "Price is required!"]
				},
				quantity: {
					type: Number,
					required: [true, "Quantity is required!"]
				},
				subTotal: {
					type: Number,
					required: [true, "Subtotal is required!"]
				}
			}
		],
		totalAmount: {
			type: Number,
			required: [true, "Total Amount is required!"]
		}
	},
	orderedProduct: [
		{
			products: [
				{
					productId: {
						type: String,
						required: [true, "Product Id is required!"]
					},
					productName: {
						type: String,
						required: [true, "Product Name is required!"]
					},
					quantity: {
						type: Number,
						required: [true, "Quantity is required!"]
					}
				}
			],
			subTotal: {
				type: Number,
				required: [true, "Subtotal is required!"]
			},
			totalAmount: {
				type: Number,
				required: [true, "Total Amount is required!"]
			},
			paymentMethod: {
				type: String,
				enum: ["Credit Card", "Paypal", "Cash on Delivery"]
			},
			status: {
				type: String,
				enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
				default: "Pending"
			},
			purchasedOn: {
				type: Date,
				default: new Date()
			},
			deliveredOn: {
				type: Date,
				default: null
			}
		}
	],
	createdOn: {
		type: Date,
		default: new Date()
	}
});

const User = mongoose.model("users", userSchema);

module.exports = User;