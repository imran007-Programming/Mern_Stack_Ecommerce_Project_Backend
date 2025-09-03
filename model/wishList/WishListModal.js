const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    productid: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true
    },
    
    sizes: {
        type: [String],
        required: true
    }
}, { timestamps: true });

const wishListDb = mongoose.model("wishList", WishlistSchema);

module.exports = wishListDb;
