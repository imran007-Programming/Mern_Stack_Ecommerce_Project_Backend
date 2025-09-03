const mongoose = require("mongoose")
const bannerSchema = new mongoose.Schema({
    images: [{
        type: String,
        require: true

    }]
}, { timestamps: true })

const bannerDb = new mongoose.model("bannermodel", bannerSchema)
module.exports = bannerDb