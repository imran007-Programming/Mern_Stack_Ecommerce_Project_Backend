const nodemailer = require("nodemailer");
///email config...

exports.transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {

        user: process.env.EMAIL,
        pass: process.env.PASSWORD

    }
})

// efcnlnjyafutnsnq
// baounhjvzwpcqlck
