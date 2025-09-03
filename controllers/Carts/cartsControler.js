const cartDb = require("../../model/Carts/cartsModel")
const productDb = require("../../model/product/productModel")
////addtocart controler//


exports.AddtoCart = async (req, res) => {
    const { id } = req.params;
    const { quantity, size } = req.body;
  
    try {
      // Fetch the product details
      const getproduct = await productDb.findOne({ _id: id });
  
      // Check if product exists
      if (!getproduct) {
        return res.status(404).json({ error: "Product not found" });
      }
  
      // Ensure there's enough stock
      if (getproduct.quantity < quantity) {
        return res.status(400).json({ error: "Insufficient stock for the requested quantity" });
      }
  
      // Now, ensure that productImage is included in the response
      const productDetails = {
        productName: getproduct.productName,
        productImage: getproduct.images,  // Ensure productImage is returned
        price: getproduct.price,
        quantity: getproduct.quantity
      };
  
      // Handle the cart item logic as usual
      const cartItem = await cartDb.findOne({ userid: req.userId, productid: id });
  
      if (cartItem) {
        if (cartItem.quantity + quantity <= 5) {
          // Increment quantity of existing cart item
          cartItem.quantity += quantity;
  
          // Ensure size is unique in the array
          const newSizes = Array.isArray(size) ? size : [size];
          newSizes.forEach(newSize => {
            if (!cartItem.sizes.includes(newSize)) {
              cartItem.sizes.push(newSize);
            }
          });
  
          await cartItem.save();
  
          // Decrement product quantity
          getproduct.quantity -= quantity;
          await getproduct.save();
  
          return res.status(200).json({
            message: "Product quantity added",
            productDetails, // Return product image and other details
            updatedCart: cartItem
          });
        } else {
          return res.status(400).json({ error: "Can't add more than 5 products" });
        }
      } else {
        if (getproduct.quantity >= quantity) {
          // Create new cart item
          const addtoCart = new cartDb({
            userid: req.userId,
            productid: id,
            quantity: quantity,
            sizes: size
          });
  
          // Ensure the size array is unique
          if (Array.isArray(size)) {
            addtoCart.sizes = [...new Set(size)];
          } else {
            addtoCart.sizes = [size];
          }
  
          await addtoCart.save();
  
          // Decrement product quantity
          getproduct.quantity -= quantity;
          await getproduct.save();
  
          return res.status(200).json({
            message: "Product added to cart successfully",
            productDetails, // Include product image and details
            updatedCart: addtoCart
          });
        } else {
          return res.status(400).json({ error: "Insufficient stock for the requested quantity" });
        }
      }
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  };
  





////Getcart items controler//

exports.Getcart = async (req, res) => {
    try {
        const getcarts = await cartDb.aggregate([
            {
                $match: { userid: req.usermainid }
            },
            {
                $lookup: {
                    from: "productmodels",
                    localField: "productid",
                    foreignField: "_id",
                    as: "details"
                }
            },
            ///getting frist data from details array

            {
                $project: {
                    _id: 1,
                    userid: 1,
                    productid: 1,
                    quantity:1,
                    sizes:1,
                    details:{$arrayElemAt:['$details',0]}////Extract frist ellement from array

                }
            }
        ]);


        res.status(200).json(getcarts);
    } catch (error) {
        res.status(400).json(error);
    }
};


////REmove Items From CaRts
exports.RemoveSingleItemFromCart = async (req, res) => {
    const { id } = req.params;

    try {
        const getproduct = await productDb.findOne({ _id: id });
        if (!getproduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        const checkCart = await cartDb.findOne({ userid: req.userId, productid: getproduct._id });
        if (!checkCart) {
            return res.status(400).json({ error: "Cart item not found" });
        }

        if (checkCart.quantity == 1) {
            // Delete the cart item
            await cartDb.findByIdAndDelete({ _id: checkCart._id });
            // Increment product quantity
            getproduct.quantity += 1;
            await getproduct.save();
            return res.status(200).json({ message: "product removed" });
        } else if (checkCart.quantity > 1) {
            // Decrement cart item quantity
            checkCart.quantity -= 1;
            await checkCart.save();
            // Increment product quantity
            getproduct.quantity += 1;
            await getproduct.save();
            return res.status(200).json({ message: "product quantity removed" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};

////Remove all Items form cart///
exports.Removeallitems = async (req, res) => {
    const { id } = req.params
    try {
        const getproduct = await productDb.findOne({ _id: id })
        const checkCart = await cartDb.findOne({ userid: req.userId, productid: getproduct._id })
        if (!checkCart) {
            res.status(400).json({ error: "cart items not forund" })
        }

        const deletecartItem = await cartDb.findByIdAndDelete({ _id: checkCart._id })
        getproduct.quantity = getproduct.quantity + checkCart.quantity
        await getproduct.save()
        res.status(200).json({ message: "Item Sucessfully Remove From Cart", deletecartItem })



    } catch (error) {
        res.status(400).json(error)
    }
}


////Delete items from cart when ordred done//
exports.Emptycart = async (req, res) => {
    try {
        const Deletecats = await cartDb.deleteMany({ userid: req.userId })
        res.status(200).json(Deletecats)
    } catch (error) {
        res.status(400).json(error)
    }
}