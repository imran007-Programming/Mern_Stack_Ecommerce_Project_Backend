const adminDb = require("../../model/admin/adminModal");
const jwt = require("jsonwebtoken");
const Secret_Key = process.env.ADMIN_SECRET_KEY;
const adminAuthentication = async (req,res,next)=>{
     try {
        const token =req.headers.authorization;
         const verifytoken= jwt.verify(token,Secret_Key);
         const rootUser =await adminDb.findOne({_id:verifytoken._id})
        if(!rootUser){
            throw new Error("user not found")
        }
        req.token =token
        req.rootUser= rootUser
        req.userId=rootUser._id
        next()
        } catch (error) {
        res.status(400).json({error:"Unauthorized No token Provided"})
     }
}
module.exports= adminAuthentication;