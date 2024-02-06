const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
	productName: {
		type: String,
		required: [true, "Product Name is required!"]
	},
	productDescription: {
		type: String,
		required: [true, "Product Description is required!"]
	},
	price: {
		type: Number,
		required: [true, "Price is required!"]
	},
	stocks: {
		type: Number,
		required: [true, "Stocks is required!"]
	},
	sold: {
		type: Number,
		default: 0
	},
	image: {
		type: String,
		default: null
	},
	reviews: [
		{
			userId: {
				type: String,
				required: [true, "User Id is required!"]
			},
			message: {
				type: String,
				required: [true, "Message is required!"]
			},
			rating: {
				type: Number,
				required: [true, "Rating is required!"]
			}
		}
	],
	userOrders: [
		{
			userId: {
				type: String,
				required: [true, "User Id is required!"]
			}
		}
	],
	impressions: {
		type: Number,
		default: 0
	},
	isActive: {
		type: Boolean,
		default: true
	},
	createdOn: {
		type: Date,
		default: new Date()
	},
	updatedOn: {
		type: Date,
	}
})

const Product = mongoose.model("products", productSchema);

module.exports = Product