const { default: mongoose } = require("mongoose");

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    require: true,
  },
  email: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "productmodels",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      productName: {
        type: String,
      },
      sizes: {
        type: [String],
        default: [],
      },
    },
  ],
  city: {
    type: String,
    require: true,
  },
  zone: {
    type: String,
    require: true,
  },
  area: {
    type: String,
    require: true,
  },
  address: {
    type: String,
    require: true,
  },
  notes: {
    type: String,
  },
  cupon: {
    type: String,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["bkash", "cod", "card"],
    default: "cod",
    required: true,
  },
  total: {
    type: Number,
  },
  discount: {
    type: Number,
  },
});

const orderDb = new mongoose.model("orderModels", orderSchema);
module.exports = orderDb;
