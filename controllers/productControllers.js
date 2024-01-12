const Product = require("../models/Product.js");
const bcrypt = require("bcryptjs");
const auth = require("../auth.js");

/*
	Create product by:
	1. Creating a new instance of a new product
	2. Contain the request body inside reqBody and passed it to the newProduct other required properties
	3. Save the newProduct inside the database
*/
module.exports.createProduct = (request, response) => {
	let reqBody = request.body;

	const newProduct = new Product({
		productName: reqBody.productName,
		productDescription: reqBody.productDescription,
		price: reqBody.price,
		stocks: reqBody.stocks
	});

	newProduct.save().then(save => {
		return response.send(`${reqBody.productName} is successfully created!`)
	}).catch(error => {
		return response.send(false)
	})
}

// Get all products
module.exports.getAllProducts = (request, response) => {
	Product.find({}).then(result => response.send(result)).catch(error => response.send(error))
}

/*
	Retrieve all active products by:
	1. Adding a search criteria in finding only the active products
*/
module.exports.getAllActive = (request, response) => {
	Product.find({isActive: true}).then(result => response.send(result)).catch(error => response.send(error))
}

/*
	Retrieve a single product by:
	1. Finding only the product by id contained in the params
*/
module.exports.getProduct = (request, response) => {
	let productId = request.params.productId;
	Product.findById(productId).then(result => response.send(result)).catch(error => response.send(error));
}

/*
	Update product information by:
	1. Create a variable "updatedCourse" which will contain the information retrieved from the request body
	2. Find and update the course using the course ID retrieved from the request params property and the variable "updatedCourse" containing the information from the request body
	3. Pass a new date to updatedOn property when updating the product information
*/
module.exports.updateProduct = (request, response) => {
	let reqBody = request.body;

	const updatedProduct = {
		productName: reqBody.productName,
		productDescription: reqBody.productDescription,
		price: reqBody.price,
		stocks: reqBody.stocks,
		updatedOn: new Date()
	}

	Product.findByIdAndUpdate(request.params.productId, updatedProduct).then(result => {
		return response.send(`${reqBody.productName} is successfully updated!`)
	}).catch(error => response.send("Error encountered during the update."))
}

/*
	Archive product by:
	1. Create a variable of an updatedCourse and set the isActive to false
	2. Pass the productId from the params and the updatedCourse object to the query params
*/
module.exports.archiveProduct = (request, response) => {
	const updatedProduct = {
		isActive: false
	}

	Product.findByIdAndUpdate(request.params.productId, updatedProduct).then(result => {
		return response.send("The product is now inactive")
	}).catch(error => response.send("Error encountered during the update."))
}

/*
	Archive product by:
	1. Create a variable of an updatedCourse and set the isActive to true
	2. Pass the productId from the params and the updatedCourse object to the query params
*/
module.exports.activateProduct = (request, response) => {
	const updatedProduct = {
		isActive: true
	}

	Product.findByIdAndUpdate(request.params.productId, updatedProduct).then(result => {
		return response.send("The product is now active")
	}).catch(error => response.send("Error encountered during the update."))
}