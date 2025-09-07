const cloudinary = require("../../cloudinary/cloudinary");
const userDb = require("../../model/user/userModal");
const bcrypt = require("bcrypt");
const fs = require("fs")
const ejs = require("ejs")
const jwt = require("jsonwebtoken");
const SECRET_KEY = "bdsfbdsfhwrumvcmz"
const path = require("path");
const { transporter } = require("../../helper");
const express = require("express");



///user registration Controler
exports.Register = async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  if (!firstname || !lastname || !email || !password || !confirmPassword || !req.file) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Use the same Cloudinary helper as category
    const filename = `user-${Date.now()}.${req.file.originalname.split(".").pop()}`;
    const upload = await cloudinary.uploadToCloudinary(req.file.buffer, filename);


    // Check if user already exists
    const exsitUser = await userDb.findOne({ email });
    if (exsitUser) {
      return res.status(400).json({ error: "User Already Exist" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Password and confirmPassword not matched" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save user
    const userData = new userDb({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      userprofile: upload.secure_url, // Cloudinary image
    });

    await userData.save();
    res.status(200).json(userData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};





///user Login Controler
exports.Login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: "all field required",
    });
  }
  try {
    const userValidation = await userDb.findOne({ email: email });

    if (userValidation) {
      const isMatch = await bcrypt.compare(password, userValidation.password);
      if (!isMatch) {
        res.status(400).json({ error: "invalid details" });
      } else {
        //TOKEN GENARATE
        const token = await userValidation.generateUserAuthToken();
        const result = {
          userValidation,
          token,
        };

        res.status(200).json(result);
      }
    } else {
      res.status(400).json({ error: "invalid Email and Password" });
    }
  } catch (error) {
    res.status(400).json(error);
  }
};
///user verify
exports.Userverify = async (req, res) => {
  try {
    const verifyUser = await userDb.findOne({ _id: req.userId });
    res.status(200).json(verifyUser);
  } catch (error) {
    res.status(400).json(error);
  }
};

////User Logout controlers
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

////User Forgotpassword Controler
exports.Forgotpasssword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Enter your Email" })
  }
  try {
    const userFind = await userDb.findOne({ email: email })
    if (userFind) {
      ///token genarate for password change;
      const token = jwt.sign({ _id: userFind._id }, SECRET_KEY, {
        expiresIn: "120s"
      })
      const setuserToken = await userDb.findByIdAndUpdate({ _id: userFind._id }, { verifytoken: token }, { new: true })
      ////join the Emailtemplete
      const emailtempletepath = path.join(__dirname, "../../Emailtemplate/ForgotpasswordTemplte.ejs")
      const emailTempleteRead = fs.readFileSync(emailtempletepath, "utf8")

      ///SEt token and logo in ejs file///
      const data = {
        passwordresetlink: `https://emartly.vercel.app/resetpassword/${userFind.id}/${setuserToken.
          verifytoken}`,
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
      }

      ////set dinamicdata in ejs//
      const renderTemplete = ejs.render(emailTempleteRead, data)
      if (setuserToken) {
        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "Sending Email For Password Reset",
          html: renderTemplete
        }
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            res.status(400).json({ error: "email not send" })
          }
          else {
            console.log("email sent", info.response)
            res.status(200).json({ message: "email sent successfully" })
          }
        })
      }
    } else {
      res.status(400).json({ error: "this user is not exist" })
    }
  } catch (error) {
    res.status(400).json(error);
  }
}

/////Reset password Controler//
exports.Forgotpassswordverify = async (req, res) => {
  const { id, token } = req.params;
  try {
    const validUser = await userDb.findOne({ _id: id, verifytoken: token })
    const verifytoken = jwt.verify(token, SECRET_KEY)
    if (validUser && verifytoken._id) {
      res.status(200).json({ message: "Valid User" })
    } else {
      res.status(400).json({ error: "user not exist" })
    }
  } catch (error) {
    res.status(400).json(error)
  }
}

////ResetPAssword Controler///
exports.Resetpasssword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body


  try {

    const validUser = await userDb.findOne({ _id: id, verifytoken: token })
    const verifytoken = jwt.verify(token, SECRET_KEY)
    if (validUser && verifytoken._id) {

      const newpassword = await bcrypt.hash(password, 12);

      const updatePassword = await userDb.findByIdAndUpdate({ _id: id }, { password: newpassword }, { new: true });
      await updatePassword.save()

      res.status(200).json({ message: "New password updated successfully" })
    }


    else {
      res.status(400).json({ error: "Session time out please genarate a new link" })
    }



  } catch (error) {
    res.status(400).json(error)
  }
}


////get user Router///

exports.Getalluser = async (req, res) => {
  const page = req.query.page || 1;
  const Items_Per_page = 4;



  try {
    const skip = (page - 1) * Items_Per_page;
    const count = await userDb.countDocuments()

    const getalluser = await userDb.find()
      .limit(Items_Per_page)
      .skip(skip)
      .sort({ _id: -1 })

    const pageCount = Math.ceil(count / Items_Per_page);
    res.status(200).json({
      getalluser,
      pagination: {
        totaluser: count,
        pageCount
      }

    });
  } catch (error) {
    res.status(400).json(error)
  }
}

////Delete user ///
exports.Deleteuser = async (req, res) => {
  const { userid } = req.params
  try {
    const deleteuser = await userDb.findByIdAndDelete({ _id: userid })
    res.status(200).json(deleteuser)
  } catch (error) {
    res.status(400).json(error)
  }
}