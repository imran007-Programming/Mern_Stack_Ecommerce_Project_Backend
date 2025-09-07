const mongoose = require("mongoose");
const DB = process.env.DATABASE;

mongoose
  .connect(DB)
  .then(() => console.log("Database connected"))
  .catch((err) => {
    if (
      err.code === "ENOTFOUND" ||
      err.message.includes("getaddrinfo ENOTFOUND")
    ) {
      console.log(
        "Network error: Internet connection lost. Please check your connection."
      );
    } else {
      console.log("Error connecting to database");
    }
  });

  // Listen for unhandled promise rejections globally
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);

  // Optionally exit process if it's critical
  process.exit(1);
});
