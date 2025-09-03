const multer = require("multer");

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "./categoryuploads");
    },
    filename: (req, file, callback) => {
        const filename = `image-${Date.now()}.${file.originalname}`;
        callback(null, filename);
    }
});

// File filter function
const filefilter = (req, file, callback) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg" || file.mimetype === "image/webp" || file.mimetype === "image/avif") {
        callback(null, true);
    } else {
        callback(new Error("Only PNG, JPG, JPEG, WEBP, and AVIF formatted files are allowed"));
    }
};

// Multer instance
const categoryupload = multer({
    storage: storage,
    fileFilter: filefilter
});

module.exports = categoryupload;
