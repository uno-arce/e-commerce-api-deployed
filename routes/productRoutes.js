const express = require("express");
const upload = require('../multerConfig.js');
const productControllers = require("../controllers/productControllers.js");
const auth = require("../auth.js");
const {verify, verifyAdmin} = auth;

const router = express.Router();

// route for create product, admin only
router.post("/create-product", verify, verifyAdmin, upload.single('image'), productControllers.createProduct);

// route for get all products, admin only
router.get("/all", verify, verifyAdmin, productControllers.getAllProducts);

// route for get all active products
router.get("/", productControllers.getAllActive);

// route for getting the information of a specific product
router.get("/:productId", productControllers.getProduct);

// route for updating a product, admin only
router.put("/:productId/update", verify, verifyAdmin, upload.single('image'), productControllers.updateProduct);

// route for archiving a product, admin only
router.put("/:productId/archive", verify, verifyAdmin, productControllers.archiveProduct);

// route for archiving a product, admin only
router.put("/:productId/activate", verify, verifyAdmin, productControllers.activateProduct);

module.exports = router;