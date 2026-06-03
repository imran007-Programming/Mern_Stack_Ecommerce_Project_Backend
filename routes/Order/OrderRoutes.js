const express = require("express");
const OrderControler = require("../../controllers/Order/OrderController.js");
const userAuthentication = require("../../middleware/user/userAuthenticate.js");
const adminAuthentication = require("../../middleware/admin/adminAuthenticate.js");
const router = new express.Router();

// Place order
router.post("/confirmorder", OrderControler.Order);

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
