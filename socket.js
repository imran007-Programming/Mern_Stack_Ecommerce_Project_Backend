// socket.js
const { Server } = require("socket.io");
const Chats = require("./model/chats/Chats");
const ActiveUser = require("./model/activeuser/ActiveUser");

let io;
// const activeUsers = {};

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join a private room
    socket.on("join-room", async ({ roomId, user }) => {
      socket.join(roomId);

      // Save to DB
      await ActiveUser.findOneAndUpdate(
        { roomId, user },
        { socketId: socket.id, lastSeen: new Date() },
        { upsert: true }
      );

      // Load chat history
      const messages = await Chats.find({ roomId }).sort({ time: 1 });
      socket.emit("chat-history", messages);

      //   // Track active users
      //   if (!activeUsers[roomId]) activeUsers[roomId] = [];
      //   activeUsers[roomId].push({ user, socketId: socket.id });

      //   io.emit("active-users", activeUsers);

      // Send updated active users list from DB
      const users = await ActiveUser.find({});
      io.emit("active-users", users);
    });

    // Handle messages
    socket.on("message", async ({ roomId, user, text }) => {
      const msgData = { roomId, user, text, time: new Date() };

      const message = new Chats(msgData);
      await message.save();

      io.to(roomId).emit("message", msgData);
    });

    // ✅ Admin asks for active users
    // socket.on("get-active-users", () => {
    //   socket.emit("active-users", activeUsers);
    // });

    socket.on("get-active-users", async () => {
      const users = await ActiveUser.find({});
      socket.emit("active-users", users);
    });

    // Disconnect
    // socket.on("disconnect", () => {
    //   for (const roomId in activeUsers) {
    //     activeUsers[roomId] = activeUsers[roomId].filter(
    //       (u) => u.socketId !== socket.id
    //     );
    //     if (activeUsers[roomId].length === 0) delete activeUsers[roomId];
    //   }
    //   io.emit("active-users", activeUsers);
    // });

    socket.on("disconnect", async () => {
      await ActiveUser.findOneAndDelete({ socketId: socket.id });

      const users = await ActiveUser.find({});
      io.emit("active-users", users);
    });
  });
}

module.exports = { initSocket };
