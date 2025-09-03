const jwt = require("jsonwebtoken");
const userDb = require("../../model/user/userModal");
const Secret_Key = process.env.USER_SECRET_KEY;

const userAuthentication = async (req, res, next) => {
    try {
        const token = req.headers.authorization;

        const verifytoken = jwt.verify(token, Secret_Key);
        const rootUser = await userDb.findOne({ _id: verifytoken._id })

        if (!rootUser) {
            throw new Error("user not found")
        }
        req.token = token
        req.rootUser = rootUser
        req.userId = rootUser._id
        req.usermainid = rootUser.id

        next()
    } catch (error) {
        res.status(400).json({ error: "Unauthorized No token Provided" })
    }
}
module.exports = userAuthentication;