require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const axios = require("axios");
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

  // 👇 Start keep-alive ONLY after server is up
  const keepAliveInterval = setInterval(() => {
    axios
      .get("https://mern-stack-ecommerce-project-backend-1.onrender.com")
      .then(() => console.log("🔔 Keep-alive ping sent"))
      .catch((err) => console.error(`❌ Keep-alive failed: ${err.message}`));
<<<<<<< HEAD
  }, 780000);
=======
  }, 78000);
>>>>>>> dbc2d49960efeffb45dd80c874a7e4c273fd36fb

  // 👇 Clean up on shutdown
  process.on("SIGTERM", () => {
    clearInterval(keepAliveInterval);
    server.close(() => process.exit(0));
  });

  process.on("SIGINT", () => {
    clearInterval(keepAliveInterval);
    server.close(() => process.exit(0));
  });
});
