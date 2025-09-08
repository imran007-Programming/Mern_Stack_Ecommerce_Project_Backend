const express =require("express")
const OrderControler=require("../../controllers/Order/OrderController.js")
const router = new express.Router();

router.post("/confirmorder",OrderControler.Order)


module.exports =router;