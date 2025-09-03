const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    productid: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true
    },
    quantity: {
        type: Number
    },
    sizes: {
        type: [String],
        required: true
    }
}, { timestamps: true });

const cartDb = mongoose.model("carts", cartSchema);

module.exports = cartDb;
