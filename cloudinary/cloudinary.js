const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDENARY_CLOUD,
  api_key: process.env.CLOUDENARY_APIKEY,
  api_secret: process.env.CLOUDENARY_API_SECRET,
});

/* upload to clodinary */
const uploadToCloudinary = async (fileBuffer, filename) => {
  const { Readable } = require('stream');
  const stream = Readable.from(fileBuffer);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'productimages',
        public_id: filename.split('.')[0],
      },
      (error, result) => {
        if (error) {
          
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    stream.pipe(uploadStream);
  });
};

// ✅ Delete image by publicId
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
