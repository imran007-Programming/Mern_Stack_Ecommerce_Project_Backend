const express = require("express");
const OrderControler = require("../../controllers/Order/OrderController.js");
const PaymentController = require("../../controllers/Order/PaymentController.js");
const userAuthentication = require("../../middleware/user/userAuthenticate.js");
const adminAuthentication = require("../../middleware/admin/adminAuthenticate.js");
const router = new express.Router();

// Place order (COD)
router.post("/confirmorder", OrderControler.Order);

// Payment: Stripe create payment intent
router.post("/stripe/create-payment-intent", PaymentController.createStripePayment);

// Payment: Stripe confirm and create order
router.post("/stripe/confirm-order", PaymentController.stripePaymentSuccess);

// Payment: SSLCommerz init
router.post("/sslcommerz/init", PaymentController.createSSLPayment);

// Payment: SSLCommerz callbacks
router.post("/sslcommerz/success", PaymentController.sslPaymentSuccess);
router.post("/sslcommerz/fail", PaymentController.sslPaymentFail);
router.post("/sslcommerz/cancel", PaymentController.sslPaymentCancel);

// Get logged-in user's orders
router.get("/myorders", userAuthentication, OrderControler.GetUserOrders);

// Cancel an order (user)
router.put("/cancel/:orderId", userAuthentication, OrderControler.CancelOrder);

// Delete a canceled order (user)
router.delete("/delete/:orderId", userAuthentication, OrderControler.UserDeleteOrder);

// Admin: Get all orders
router.get("/admin/allorders", adminAuthentication, OrderControler.GetAllOrders);

// Admin: Update order status
router.put("/admin/updatestatus/:orderId", adminAuthentication, OrderControler.UpdateOrderStatus);

// Admin: Delete an order
router.delete("/admin/delete/:orderId", adminAuthentication, OrderControler.DeleteOrder);

// Admin: Bulk delete orders
router.post("/admin/bulkdelete", adminAuthentication, OrderControler.BulkDeleteOrders);

module.exports = router;
