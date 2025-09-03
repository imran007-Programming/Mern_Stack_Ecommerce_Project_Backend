const multer = require("multer");

const storage = multer.memoryStorage(); // Store the file in memory instead of disk

const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    callback(null, true);
  } else {
    callback(new Error("Only PNG, JPG, and JPEG formats are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
});

module.exports = upload;
