require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./db/connection.js");
const { initSocket } = require("./socket.js");


const app = express();
const port = process.env.PORT || 4001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);
/* initialize socket io */
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

// Listen on HTTP server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
