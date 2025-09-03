const express = require("express");
const router = new express.Router();
const adminAuthControler = require("../../controllers/admin/adminControlers");
const adminUpload= require("../../multerconfig/admin/adminStorageConfig");
const adminAuthentication = require("../../middleware/admin/adminAuthenticate");
//admin auth routes

router.post("/register",adminUpload.single("file"),adminAuthControler.Register);


router.post("/login",adminAuthControler.Login);


///Admin verify
router.get("/adminverify",adminAuthentication, adminAuthControler.Adminverify)
/// Logout 
router.get("/logout",adminAuthentication,adminAuthControler.Logout)

module.exports = router;
