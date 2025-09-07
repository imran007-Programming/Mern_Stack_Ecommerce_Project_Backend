const mongoose = require("mongoose");
const productCategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    catimage: {
      type: String,
      require: true,
    },
    products: [
      {
        type: Object,
        ref: "productmodels",
      },
    ],
    description: {
      type: String,
      required: true,
    },

       brands: [
      {
        type: String,
      },
    ], 
  },

  { timestamps: true }
);

////modal
const categorydb = new mongoose.model("categoryModels", productCategorySchema);

module.exports = categorydb;



