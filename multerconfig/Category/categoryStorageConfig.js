const multer = require("multer");

// Memory storage (keeps file in buffer)
const storage = multer.memoryStorage();

// File filter
const filefilter = (req, file, callback) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp" ||
    file.mimetype === "image/avif"
  ) {
    callback(null, true);
  } else {
    callback(new Error("Only PNG, JPG, JPEG, WEBP, and AVIF are allowed"));
  }
};

const categoryupload = multer({
  storage: storage,
  fileFilter: filefilter,
});

module.exports = categoryupload;
