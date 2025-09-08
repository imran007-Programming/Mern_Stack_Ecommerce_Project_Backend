const mongoose = require("mongoose");

let isConnected; // Global variable for connection state

const connectDB = async () => {
  if (isConnected) {
    console.log("⚡ Using existing MongoDB connection");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout if cannot connect
    });

    isConnected = conn.connections[0].readyState;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);

    // Retry after 5s if failed
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
