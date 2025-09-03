const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Secret_Key = "fbfdbjsduuqndcbjtrtr";

////userSchema

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("not valid email");
      }
    },
  },
  userprofile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  tokens: [
    {
      token: { type: String, required: true },
    },
  ],
  ///for forgotpassword
  verifytoken: {
    type: String
  }
}, { timestamps: true });


///pasword hasing

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});


//token genarate//
userSchema.methods.generateUserAuthToken = async function () {
  try {
    let newtoken = jwt.sign({ _id: this._id }, Secret_Key, {
      expiresIn: "1d",
    });
    this.tokens = this.tokens.concat({ token: newtoken });
    await this.save();
    return newtoken;
  } catch (error) {
    res.status(400).json({ error: error });
  }
};



const userDb = new mongoose.model("users", userSchema);
module.exports = userDb
