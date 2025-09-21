const mongoose = require("mongoose");

const ActiveUserSchema = new mongoose.Schema({
  roomId: String,
  user: String,
  socketId: String,
  lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ActiveUser", ActiveUserSchema);
