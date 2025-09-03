const express = require("express")
const router = new express.Router();
const cartsControler = require("../../controllers/Carts/cartsControler")
const userAuthentication = require("../../middleware/user/userAuthenticate");

////Cart Routes
router.post("/addtocart/:id", userAuthentication, cartsControler.AddtoCart)
router.get("/getcart", userAuthentication, cartsControler.Getcart)
router.delete("/deleteitemfromcart/:id", userAuthentication, cartsControler.RemoveSingleItemFromCart)
router.delete("/removeallitemsfromcart/:id", userAuthentication, cartsControler.Removeallitems)

///remove catr items from ordered done//
router.delete("/emptycart", userAuthentication, cartsControler.Emptycart)
module.exports = router