const mongoose = require("mongoose")

const Reviewschema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    productid: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    rating: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    }
}, { timestamps: true })

const reviewDb = new mongoose.model("ratings", Reviewschema);
module.exports = reviewDb