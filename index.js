require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./db/connection.js");
const { initSocket } = require("./socket.js");

const app = express();
const port = process.env.PORT || 4001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Create HTTP server (needed for Socket.io in local dev)
const server = http.createServer(app);
initSocket(server);

// Routes
app.use("/adminauth/api", require("./routes/Admin/adminAuthroutes.js"));
app.use("/product/api", require("./routes/products/ProductsRoute.js"));
app.use("/carts/api", require("./routes/Carts/CartsRoute.js"));
app.use("/wishlist/api", require("./routes/wishList/wishListRoutes.js"));
app.use("/userauth/api", require("./routes/user/userRoutes.js"));
app.use("/order/api", require("./routes/Order/OrderRoutes.js"));

// Default route
app.get("/", (req, res) => {
  res.status(200).json("server start");
});

// Only start listening in local/non-Vercel environments
if (!process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

module.exports = app;
