const express = require("express");
const router = new express.Router();
const adminAuthentication = require("../../middleware/admin/adminAuthenticate");
const productControler = require("../../controllers/Products/productControler.js");

const {productupload} = require("../../multerconfig/Products/productStorageConfig.js");
const userAuthentication = require("../../middleware/user/userAuthenticate.js");
const categoryupload = require("../../multerconfig/Category/categoryStorageConfig.js");
// const categoryupload = require("../../multerconfig/Category/categoryStorageConfig.js");
///brand Routes//

///Add A brand//
router.post("/addbrand", adminAuthentication,productControler.AddBrand);
///get brand//
router.get("/getbrand",productControler.getBrand);
///get a single brand//
router.get("/getbrand/:id",productControler.getsingleBrand);


///Category Routes

//(Add A Category)
router.post("/addcategory", adminAuthentication, categoryupload.single("file"), productControler.Addcategory);
// 2:(_Get_Categoryes)
router.get("/getcategory", productControler.Getcategory)

///product Routes
// 1:(_Add_Product)
router.post("/addproducts", [adminAuthentication, productupload.array("files")], productControler.Addproducts)

///updated a product//

router.put("/updateproduct/:productId", [adminAuthentication, productupload.array("files")], productControler.updateProduct)

// DELETE route for deleting an image
router.delete("/deleteimage", adminAuthentication, productControler.deleteimages);

///Add baner images///
router.post("/addbannerimage",[adminAuthentication,productupload.array("files")],productControler.addBannerImages)

///Get baner images///
router.get("/getbannerimages",productControler.getBannerImages)




// 2:(_Get_Products)
router.get("/getproduct", productControler.Getproduct);

// 2:(_Get_Search_Products)
router.get("/search", productControler.SearchProducts);

router.get('/reset-products', productControler.resetProductsByCategory);

///Get a SIngel Product
router.get("/getaproduct/:productid", productControler.GetSingleProduct)
/// Delete a Product
router.delete("/deleteproducts/:productid", adminAuthentication, productControler.Deleteproducts)


// Similar Products Routes
router.get("/product/:productid/similar", productControler.findSimilarProducts);

///Newarival PRoduct
router.get("/newarival", productControler.NewArival)
///REview and Ratings a product

router.post("/reviewproduct/:productid", userAuthentication, productControler.ProductReview)

router.get("/getproductreview/:productid", productControler.GetproductReview)
/* Get all product review */
router.get("/getallreview", productControler.GetAllReview)

router.delete("/deleteproductreview/:reviewid", userAuthentication, productControler.DeleteproductReview)

module.exports = router;