const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    brand: {
        type: String,
        required: true
    },




    images: [{
        type: String,
        required:true
       
    }]

    ,
    type: {
        type: String,
        required: true
    },
    sizes: {
        type: [String],
        // enum:["S","L","M","XL","XXL","3XL"],
        // enum:["40","41","42","43","44","45"],
        required: true
    },

    colors: {
        type: [String],
        required: true
    },

    discount: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    categoryid: {
        type: String,
   
        required: true,
    },
    
}, { timestamps: true })


const productDb = new mongoose.model("productmodels", productSchema)


module.exports = productDb