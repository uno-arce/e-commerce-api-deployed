// Dependencies
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Routes
const userRoutes = require("./routes/userRoutes.js");
const productRoutes = require("./routes/productRoutes.js");

// Server
const port = 3001
const app = express();

// Database Connection
mongoose.connect("mongodb+srv://admin:admin@batch330arce.ywj69g5.mongodb.net/E-commerce_API?retryWrites=true&w=majority")
let db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection Error!"));
db.once("open", () => {
	console.log("Connected with the db!")
})

// Middlewares
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.use("/users", userRoutes);
app.use("/products", productRoutes);

app.listen(port, () => {
	console.log(`API is now online on port ${port}`);
})

