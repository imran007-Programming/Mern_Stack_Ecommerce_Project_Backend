
const adminDb = require("../../model/admin/adminModal"); 
const bcrypt = require("bcrypt");
const fs = require("fs"); 

//const bcrypt = require("bcrypt");

const cloudinary = require("../../cloudinary/cloudinary");

exports.Register = async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;



  if (!firstname || !lastname || !email || !password || !confirmPassword || !req.file) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Generate filename like category
    const filename = `admin-${Date.now()}.${req.file.originalname.split(".").pop()}`;
    const upload = await cloudinary.uploadToCloudinary(req.file.buffer, filename);

    // Check if admin already exists
    const existingAdmin = await adminDb.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Admin already exists" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Password and Confirm Password do not match" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save admin
    const adminData = new adminDb({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      profile: upload.secure_url, // Cloudinary uploaded URL
    });

    await adminData.save();
    res.status(200).json({
      success:true,
      message:"user created successfully",
      adminData
    });
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
