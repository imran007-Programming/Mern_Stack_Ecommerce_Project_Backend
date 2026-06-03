const orderDb = require("../../model/order/Ordermodel");
const productDb = require("../../model/product/productModel");


exports.Order = async (req, res) => {


  try {
    const {
      name,
      phone,
      email,
      city,
      zone,
      area,
      address,
      notes,
      userId,
      products,
      cupon,
      total,
      discount,
      paymentMethod,
    } = req.body;
    // 
    if (!name || !phone || !email || !city || !zone || !area || !address) {
      return res.status(400).json({
        success: false,
        message: "All filled must be required",
      });
    }

    // ✅ Phone validation (Bangladesh 11 digits)
    if (!/^01[0-9]{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    // ✅ Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // ✅ Payment validation
    if (!["bkash", "cod", "card"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Choose bkash, cod, or card",
      });
    }


   // Validation
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: "No products added to order" });
    }

    const newOrder = new orderDb({
      name,
      phone,
      email,
      city,
      zone,
      area,
      address,
      notes,
      userId,
      products,  
      cupon,
      total,
      discount,
      paymentMethod,
    });
    await newOrder.save();

    // Decrease product stock
    for (const item of products) {
      await productDb.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -(item.quantity || 1) } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
  
     res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get user's orders (order history)
exports.GetUserOrders = async (req, res) => {
  try {
    const orders = await orderDb
      .find({ userId: req.userId })
      .populate("products.productId", "productName images price discount")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Cancel an order
exports.CancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  try {
    const order = await orderDb.findOne({ _id: orderId, userId: req.userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Only allow cancellation if order is pending
    if (order.status && order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be canceled",
      });
    }

    order.status = "canceled";
    order.cancelReason = reason || "";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order canceled successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// User: Delete a canceled order
exports.UserDeleteOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await orderDb.findOne({ _id: orderId, userId: req.userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "canceled") {
      return res.status(400).json({ success: false, message: "Only canceled orders can be deleted" });
    }

    await orderDb.findByIdAndDelete(orderId);

    res.status(200).json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin: Get all orders
exports.GetAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const totalOrders = await orderDb.countDocuments(filter);
    const orders = await orderDb
      .find(filter)
      .populate("userId", "firstname lastname email userprofile")
      .populate("products.productId", "productName images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        total: totalOrders,
        page,
        pages: Math.ceil(totalOrders / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Admin: Update order status
exports.UpdateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "processing", "shipped", "delivered", "canceled"];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  try {
    const order = await orderDb.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate("userId", "firstname lastname email userprofile")
     .populate("products.productId", "productName images price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Admin: Delete an order
exports.DeleteOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await orderDb.findByIdAndDelete(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Admin: Bulk delete orders
exports.BulkDeleteOrders = async (req, res) => {
  const { orderIds } = req.body;
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({ success: false, message: "Order IDs required" });
  }
  try {
    const result = await orderDb.deleteMany({ _id: { $in: orderIds } });
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} orders deleted`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
