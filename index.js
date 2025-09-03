require("dotenv").config();
const express = require("express")
const app = express();
const cors = require("cors")
const port =process.env.PORT||4001;
require("./db/connection.js")
app.use(cors())
app.use(express.json())

//admin Routes
const adminAuthRoutes = require("./routes/Admin/adminAuthroutes.js")
app.use("/adminauth/api", adminAuthRoutes)

//PRoducts Routes
const productsRoutes = require("./routes/products/ProductsRoute.js")
app.use("/product/api", productsRoutes)


///Carts Routes////
const CartRoutes = require("./routes/Carts/CartsRoute.js");
app.use("/carts/api", CartRoutes)

///wishlist Routes////
const wishListRoutes = require("./routes/wishList/wishListRoutes");
app.use("/wishlist/api", wishListRoutes)

////Users Routes
const userRoutes = require("./routes/user/userRoutes.js")
app.use("/userauth/api", userRoutes)

///Ratings Routes//


app.get("/", (req, res) => {
    res.status(200).json("server start")
})

app.listen(port, () => {
    console.log(`server start at ${port}`)
})
