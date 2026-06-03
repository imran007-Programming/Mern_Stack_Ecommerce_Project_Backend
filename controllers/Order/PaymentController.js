const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const SSLCommerzPayment = require("sslcommerz-lts");
const orderDb = require("../../model/order/Ordermodel");
const productDb = require("../../model/product/productModel");
const { v4: uuidv4 } = require("crypto");

const store_id = process.env.SSL_STORE_ID;
const store_passwd = process.env.SSL_STORE_PASSWORD;
const is_live = process.env.SSL_IS_LIVE === "true";

// Stripe: Create Checkout Session (redirect-based)
exports.createStripePayment = async (req, res) => {
  const {
    name, phone, email, city, zone, area, address, notes,
    userId, products, cupon, total, discount,
  } = req.body;

  try {
    // Save order with pending payment
    const newOrder = new orderDb({
      name, phone, email, city, zone, area, address, notes,
      userId, products, cupon, total, discount,
      paymentMethod: "card",
      status: "pending",
      paymentStatus: "pending",
    });
    await newOrder.save();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "bdt",
            product_data: {
              name: `Emart Order #${newOrder._id.toString().slice(-6).toUpperCase()}`,
              description: products.map((p) => p.productName).join(", ").slice(0, 200),
            },
            unit_amount: Math.round(total * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: newOrder._id.toString() },
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${newOrder._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    });

    res.status(200).json({
      success: true,
      url: session.url,
      orderId: newOrder._id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Stripe: Verify session and confirm order
exports.stripePaymentSuccess = async (req, res) => {
  const { sessionId, orderId } = req.body;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ success: false, message: "Payment not completed" });
    }

    const order = await orderDb.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.paymentStatus === "paid") {
      return res.status(200).json({ success: true, message: "Already confirmed", order });
    }

    order.paymentStatus = "paid";
    order.transactionId = session.payment_intent;
    await order.save();

    // Decrease stock
    for (const item of order.products) {
      await productDb.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -(item.quantity || 1) },
      });
    }

    res.status(200).json({ success: true, message: "Payment confirmed", order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
exports.createSSLPayment = async (req, res) => {
  const {
    name, phone, email, city, zone, area, address, notes,
    userId, products, cupon, total, discount, paymentMethod,
  } = req.body;

  const tran_id = `TXN_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Save order with pending payment status
    const newOrder = new orderDb({
      name, phone, email, city, zone, area, address, notes,
      userId, products, cupon, total, discount,
      paymentMethod: "sslcommerz",
      status: "pending",
      transactionId: tran_id,
      paymentStatus: "pending",
    });
    await newOrder.save();

    const backendUrl = process.env.BACKEND_URL || "http://localhost:4001";

    const data = {
      total_amount: total,
      currency: "BDT",
      tran_id: tran_id,
      success_url: `${backendUrl}/order/api/sslcommerz/success`,
      fail_url: `${backendUrl}/order/api/sslcommerz/fail`,
      cancel_url: `${backendUrl}/order/api/sslcommerz/cancel`,
      ipn_url: `${backendUrl}/order/api/sslcommerz/success`,
      shipping_method: "Courier",
      product_name: products.map((p) => p.productName).join(", ").slice(0, 250),
      product_category: "General",
      product_profile: "general",
      cus_name: name,
      cus_email: email || "customer@emart.com",
      cus_add1: address,
      cus_city: city,
      cus_state: zone,
      cus_postcode: area || "1000",
      cus_country: "Bangladesh",
      cus_phone: phone,
      ship_name: name,
      ship_add1: address,
      ship_city: city,
      ship_state: zone,
      ship_postcode: area || "1000",
      ship_country: "Bangladesh",
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (apiResponse?.GatewayPageURL) {
      res.status(200).json({
        success: true,
        url: apiResponse.GatewayPageURL,
        orderId: newOrder._id,
      });
    } else {
      res.status(400).json({ error: "Failed to initialize payment" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// SSLCommerz: Payment Success callback
exports.sslPaymentSuccess = async (req, res) => {
  const tran_id = req.body?.tran_id || req.query?.tran_id;

  console.log("SSLCommerz success callback:", { tran_id, body: req.body });

  if (!tran_id) {
    return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
  }

  try {
    const order = await orderDb.findOne({ transactionId: tran_id });
    if (!order) {
      console.log("Order not found for tran_id:", tran_id);
      return res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
    }

    order.paymentStatus = "paid";
    await order.save();

    // Decrease stock
    for (const item of order.products) {
      await productDb.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -(item.quantity || 1) },
      });
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment/success`);
  } catch (error) {
    console.log("SSLCommerz success error:", error.message);
    res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
  }
};

// SSLCommerz: Payment Fail callback
exports.sslPaymentFail = async (req, res) => {
  const { tran_id } = req.body || req.query;

  try {
    await orderDb.findOneAndUpdate(
      { transactionId: tran_id },
      { paymentStatus: "failed", status: "canceled" }
    );
  } catch {}

  res.redirect(`${process.env.FRONTEND_URL}/payment/fail`);
};

// SSLCommerz: Payment Cancel callback
exports.sslPaymentCancel = async (req, res) => {
  const { tran_id } = req.body || req.query;

  try {
    await orderDb.findOneAndDelete({ transactionId: tran_id });
  } catch {}

  res.redirect(`${process.env.FRONTEND_URL}/viewcart/checkout`);
};
