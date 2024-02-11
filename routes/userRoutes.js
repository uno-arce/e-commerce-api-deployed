const express = require("express");
const userControllers = require("../controllers/userControllers.js")
const auth = require("../auth.js");
const {verify, verifyAdmin} = auth;

const router = express.Router();

router.post("/register", userControllers.checkUserExists, userControllers.register);

router.post("/login", userControllers.login);

router.post("/details", verify, userControllers.getDetails);

router.get("/:userId/user", userControllers.getProfile);

router.post("/:productId/checkout", verify, userControllers.checkout);

router.post('/checkoutCart', verify, userControllers.checkoutCart);

router.put("/update-to-admin", verify, verifyAdmin, userControllers.updateToAdmin);

router.put("/update-profile", verify, userControllers.updateProfile);

router.put('/reset-password', verify, userControllers.resetPassword);

router.get("/my-orders", verify, userControllers.retrieveUserOrders);

router.get("/all-orders", verify, verifyAdmin, userControllers.retrieveAllUserOrders);

// router for add to cart
router.post("/:productId/add-to-cart", verify, userControllers.addToCart);

// router for retrieve cart products
router.get("/my-cart", verify, userControllers.retrieveCartProducts);

// router for changing a product's quantity from cart
router.put("/my-cart/edit", verify, userControllers.changeQuantity);

// router for remove a product from cart
router.put("/my-cart/remove/:productId", verify, userControllers.removeFromCart);

router.put('/my-cart/update-cart', verify, userController.updateCart);

module.exports = router;