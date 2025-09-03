const cloudinary = require("../../cloudinary/cloudinary"); // Import Cloudinary configuration
const adminDb = require("../../model/admin/adminModal"); // Admin database model
const bcrypt = require("bcrypt");
const fs = require("fs"); // For file removal after failed upload

// Register Controller
exports.Register = async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;
  const file = req.file;  // Multer will handle the profile image file

  // Ensure all fields are filled
  if (
    !firstname ||
    !lastname ||
    !email ||
    !password ||
    !confirmPassword ||
    !file
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Upload the profile image to Cloudinary
  try {
    const uploadResult = await cloudinary.uploader.upload_stream(
      {
        folder: "adminprofiles", // Folder name in Cloudinary
        public_id: `admin-${Date.now()}`, // Custom public ID based on timestamp
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ error: "Error uploading to Cloudinary" });
        }

        // Check if admin already exists
        const existingAdmin = await adminDb.findOne({ email });
        if (existingAdmin) {
          // If the admin already exists, remove the uploaded file
          const filename = req.file.filename;
          const filepath = `adminuploads/${filename}`;
          fs.unlink(filepath, (err) => {
            if (err) {
              console.log("Error deleting file: ", err);
            }
          });
          return res.status(400).json({ error: "Admin already exists" });
        } else if (password !== confirmPassword) {
          return res.status(400).json({ error: "Password and Confirm Password do not match" });
        } else {
          // Hash the password before saving to DB
          const hashedPassword = await bcrypt.hash(password, 10);

          // Create new admin data
          const adminData = new adminDb({
            firstname,
            lastname,
            email,
            password: hashedPassword,
            profile: result.secure_url,  // Cloudinary image URL for profile
          });

          // Save the admin to the database
          await adminData.save();
          res.status(200).json(adminData);  // Return the created admin data
        }
      }
    );

    // Pipe the file buffer to Cloudinary
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer); // Get the buffer from the Multer memory storage
    bufferStream.pipe(uploadResult); // Pipe the buffer to Cloudinary

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//Login Controler
exports.Login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: "all field required",
    });
  }
  try {
    const adminValidation = await adminDb.findOne({ email: email });

    if (adminValidation) {
      const isMatch = await bcrypt.compare(password, adminValidation.password);
      if (!isMatch) {
        res.status(400).json({ error: "invalid Details" });
      } else {
        //TOKEN GENARATE
        const token = await adminValidation.generateAuthToken();
        const result = {
          adminValidation,
          token,
        };

        res.status(200).json(result);
      }
    } else {
      res.status(400).json({ error: "Invalid details" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

///admin verify
exports.Adminverify = async (req, res) => {
  try {
    const verifyAdmin = await adminDb.findOne({ _id: req.userId });
    res.status(200).json(verifyAdmin);
  } catch (error) {
    res.status(400).json({ error: "invalid details" });
  }
};

///Admin Logout Controller

exports.Logout = async (req, res) => {
  try {
    req.rootUser.tokens = req.rootUser.tokens.filter((el) => {
      return el.token !== req.token;
    });
    req.rootUser.save();
    res.status(200).json({ message: "User successfully Logout" });
  } catch (error) {
    res.status(400).json(error);
  }
};
