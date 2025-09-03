const express = require("express")
const router = new express.Router();
const WishListControler = require("../../controllers/wishList/WishListControler")
const userAuthentication = require("../../middleware/user/userAuthenticate");

////WishList Routes
router.post("/addtowishlist/:id", userAuthentication, WishListControler.AddtoWishlist)
router.get("/getwishlist", userAuthentication, WishListControler.GetWishlist)
router.delete("/deleteitemfromwishlist/:id", userAuthentication, WishListControler.RemoveSingleItemFromWishlist)
// router.delete("/removeallitemsfromcart/:id", userAuthentication, cartsControler.Removeallitems)

module.exports = router;