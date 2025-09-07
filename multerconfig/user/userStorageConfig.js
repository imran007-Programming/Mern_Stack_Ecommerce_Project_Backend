const multer = require("multer");

// Use memory storage (keeps files in buffer, doesn't save locally)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp" ||
    file.mimetype === "image/avif"
  ) {
    callback(null, true);
  } else {
    callback(new Error("Only PNG, JPG, JPEG, WEBP, and AVIF formatted files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
