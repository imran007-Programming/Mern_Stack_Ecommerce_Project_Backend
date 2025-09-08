const wishListDb = require("../../model/wishList/WishListModal")
const productDb = require("../../model/product/productModel")
////addtocart controler//


exports.AddtoWishlist = async (req, res) => {
    const { id } = req.params;
 

    try {
        const getproduct = await productDb.findOne({ _id: id });
        const wishListItem = await wishListDb.findOne({ userid: req.userId, productid: id });
        
        if (!getproduct) {
            return res.status(404).json({ error: "Product not found" });
        }

       

        if (wishListItem) {
            return res.status(200).json({ message: "Product Already in the wishlist" });
               } else {
                const addtowishList = new wishListDb({
                    userid: req.userId,
                    productid: id,
                 
                 
                });
                await addtowishList.save();

                return res.status(200).json({ message: "Product added to wishlist successfully" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
    }
};




////GetWishlist items controler//

exports.GetWishlist = async (req, res) => {
    try {
        const getwishlist = await wishListDb.aggregate([
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
                    details:{$arrayElemAt:['$details',0]}////Extract frist ellement from array

                }
            }
        ]);


        res.status(200).json(getwishlist);
    } catch (error) {
        res.status(400).json(error);
    }
};


////REmove Items From wishList
exports.RemoveSingleItemFromWishlist = async (req, res) => {
    const { id } = req.params;
  
    try {
        // Check if the product exists
        const getproduct = await productDb.findOne({ _id: id });
        if (!getproduct) {
            return res.status(404).json({ error: "Product not found" });
        }
        
        // Check if the wishlist item exists
        const checkwishlist = await wishListDb.findOne({ userid: req.userId, productid: getproduct._id });
        if (!checkwishlist) {
            return res.status(400).json({ error: "Wishlist item not found" });
        }

        // Delete the wishlist item
        const deletewishlist = await wishListDb.findByIdAndDelete(checkwishlist._id);
        
        // Return success message
        return res.status(200).json({ message: "Item successfully removed from wishlist", deletewishlist });
    } catch (error) {
        // Handle unexpected errors
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};



// ////Remove all Items form cart///
// exports.Removeallitems = async (req, res) => {
//     const { id } = req.params
//     try {
//         const getproduct = await productDb.findOne({ _id: id })
//         const checkCart = await cartDb.findOne({ userid: req.userId, productid: getproduct._id })
//         if (!checkCart) {
//             res.status(400).json({ error: "cart items not forund" })
//         }

//         const deletecartItem = await cartDb.findByIdAndDelete({ _id: checkCart._id })
//         getproduct.quantity = getproduct.quantity + checkCart.quantity
//         await getproduct.save()
//         res.status(200).json({ message: "Item Sucessfully Remove From Cart", deletecartItem })



//     } catch (error) {
//         res.status(400).json(error)
//     }
// }


