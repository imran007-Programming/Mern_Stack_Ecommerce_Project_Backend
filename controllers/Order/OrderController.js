const orderDb = require("../../model/order/Ordermodel");


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
