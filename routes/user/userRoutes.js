const express = require("express");
const router = new express.Router();
const userAuthControler = require("../../controllers/user/userControlers")
const userUploads = require("../../multerconfig/user/userStorageConfig");
const userAuthentication = require("../../middleware/user/userAuthenticate");
const adminAuthentication = require("../../middleware/admin/adminAuthenticate");

///user auth Routes
router.post("/register", userUploads.single("file"), userAuthControler.Register)
router.post("/login", userAuthControler.Login)
//User Logout
router.get("/logout", userAuthentication, userAuthControler.Logout)
///user verify Routes
router.get("/userverify", userAuthentication, userAuthControler.Userverify)
///forgot password//
router.post("/forgotpassword", userAuthControler.Forgotpasssword)
///user id verify for forgotpassword///
router.get("/forgotpassword/:id/:token", userAuthControler.Forgotpassswordverify)
router.put("/resetpassword/:id/:token", userAuthControler.Resetpasssword)

///For admin access Only///
router.get("/getalluser", adminAuthentication, userAuthControler.Getalluser)

router.delete("/deleteuser/:userid", adminAuthentication, userAuthControler.Deleteuser)

module.exports = router;