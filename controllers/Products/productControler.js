const categorydb = require("../../model/product/ProductategoryModal");
const cloudinary = require("../../cloudinary/cloudinary");
const productDb = require("../../model/product/productModel");
const reviewDb = require("../../model/product/ProductReviewModal");
const fs = require("fs");
const brandDb = require("../../model/product/productBrandmodal")
const { ObjectId } = require('mongodb');
const bannerDb = require("../../model/BannerImages/BannerImages");

exports.Addcategory = async (req, res) => {
  const { categoryName, description, } = req.body;
  const file = req.file ? req.file?.path : "";


  if (!categoryName || !description || !file) {
    res.status(400).json({ error: "All field Required" });
  }


  try {
    const upload = await cloudinary.uploader.upload(file);

    const existingCategory = await categorydb.findOne({
      categoryName: categoryName,
    });

    if (existingCategory) {

      res.status(400).json({ error: "This category is already exsist" });
    } else {
      const addCategory = new categorydb({
        categoryName,
        description,
        catimage: upload.secure_url,
      });
      
      await addCategory.save();
      res.status(200).json(addCategory);
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

///add a brand
exports.AddBrand = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "All field Required" });
  }

  try {
    const brandfound = await brandDb.findOne({ name })
    if (brandfound) {
      res.status(400).json({
        error: "brand already exsist"
      })
    } else {
      const addBrand = new brandDb({
        name
      });
      await addBrand.save();
      res.status(200).json(addBrand);
    }
  } catch (error) {
    res.status(400).json(error);

  }
}

///get a brand//
exports.getBrand = async (req, res) => {
  try {
    const getAllbrand = await brandDb.find();
    res.status(200).json(getAllbrand);
  } catch (error) {
    res.status(400).json(error);
  }

}
///get a single brand//
exports.getsingleBrand = async (req, res) => {

  try {
    const getabrand = await brandDb.findById(req.params.id);
    res.status(200).json(getabrand);
  } catch (error) {
    res.status(400).json(error);
  }

}


///getCategory//
exports.Getcategory = async (req, res) => {
  try {
    const getAllCategory = await categorydb.find();
    res.status(200).json(getAllCategory);
  } catch (error) {
    res.status(400).json(error);
  }
};

////Addproduct
exports.Addproducts = async (req, res) => {
  const { categoryid } = req.query;
  const { productName, price, discount, quantity, description, type, sizes, colors, brand } = req.body;

  const file = req.files;

  if (!productName || !price || !discount || !quantity || !description || !brand || !categoryid || !file) {
    return res.status(400).json({ error: "All fields and product images are required" });
  }

  try {
    const imageUrlList = [];

    for (let i = 0; i < file.length; i++) {
      const fileBuffer = file[i].buffer;
      const filename = `image-${Date.now()}-${file[i].originalname.split('.').pop()}`;

      const result = await cloudinary.uploadToCloudinary(fileBuffer, filename);
      imageUrlList.push(result.secure_url);
    }

    // Product creation logic here
    const newProduct = new productDb({
      productName,
      price,
      discount,
      quantity,
      description,
      categoryid,
      type,
      sizes,
      colors,
      brand,
      images: imageUrlList,
    });

    await newProduct.save();

    res.status(200).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

 
exports.findSimilarProducts = async (req, res) => {
  const { productid } = req.params;

  try {
    // Find the product by its ID
    const product = await productDb.findById(productid);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Define criteria for finding similar products
    const criteria = {
      categoryid: product.categoryid, // Similar category
      _id: { $ne: productid } // Exclude the current product ID
     
    };

    // Query the database for similar products
    const similarProducts = await productDb.find(criteria)// Limit the number of results to 5
 
    res.status(200).json(similarProducts);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};







 ///Delete Products controler
exports.Deleteproducts = async (req, res) => {
  const { productid } = req.params;
  console.log(productid)
  try {
    // Find the product to be deleted
    const deletedProduct = await productDb.findById(productid);

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Remove product reference from its associated category
    const categoryFound = await categorydb.findOneAndUpdate(
      { products: { $in: [productid] } }, // Find the category that contains the product
      { $pull: { products: productid } }, // Pull the product reference from the category's products array
      { new: true }
    );

    if (!categoryFound) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete the product
    await productDb.findByIdAndDelete(productid);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};






///Search products///
exports.SearchProducts = async (req, res) => {
  try {


    let productquery = productDb.find();
    //search by name//
    if (req.query.productName) {
      productquery = productquery.find({
        productName: { $regex: req.query.productName, $options: "i" },
      });
    }

    ////await the query//
    const searchproduct = await productquery;
    res.json({
      status: "success",
      results: searchproduct.length,
      message: "products fetch sucessfully",
      searchproduct,


    });

  } catch (error) {
    res.status(400).json({ error: error.message })
  }

}



////Get PRoducts
exports.Getproduct = async (req, res) => {

  let productquery = productDb.find();



  //Filter by category//
  if (req.query.categoryId !== "all" && req.query.categoryId) {
    productquery = productquery.find({
      categoryid: req.query.categoryId,
    });
  }

  
  
  //Filter by color//
  if (req.query.color) {
    productquery = productquery.find({
      color: { $regex: req.query.color, $options: "i" },
    });
  }

  //Filter by brand//
  if (req.query.brand) {
    console.log("currentbrand",req.query.brand)
    productquery = productquery.find({
      brand: { $regex: req.query.brand, $options: "i" },
    });
  }

  //Filter by sizes//
  if (req.query.sizes) {
    console.log("currentsizes",req.query.sizes)
    productquery = productquery.find({
      sizes: { $regex: req.query.sizes, $options: "i" },
    });
  }
  //Filter by price range//
  if (req.query.price) {
    const priceRange = req.query.price.split('-')
    // console.log("currentpricerange:",priceRange)

    productquery = productquery.find({
      price: { $gte: priceRange[0], $lte: priceRange[1] }
    })
  }

  ///sort by//
  if (req.query.sortBy === 'priceLowToHigh') {
    productquery = productquery.sort({ price: 1 }); // 1 for ascending order
  } else if (req.query.sortBy === 'priceHighToLow') {
    productquery = productquery.sort({ price: -1 }); // -1 for descending order
  }


  // Sort by creation date
  if (req.query.sortBy === 'newest') {
    productquery = productquery.sort({ createdAt: -1 }); // -1 for descending order
  } else if (req.query.sortBy === 'oldest') {
    productquery = productquery.sort({ createdAt: 1 }); // 1 for ascending order
  }


  /// products pagination//
  //page
  //limi//
  //startIndex//
  //endindex//
  ///totalproduct/
  const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1
  //limit
  const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 20;

  ///startIndex//
  const skip = (page - 1) * limit
  //endindex//


  ///totalproduct//
  const count = await productDb.countDocuments()
  const pageCount = Math.ceil(count / limit);
  productquery = productquery.skip(skip).limit(limit)

  ////await the query//
  const products = await productquery;
  res.json({
    status: "success",
    results: products.length,
    count,
    Pagination: {
      totalProducts: count, pageCount
    },
    message: "products fetch sucessfully",
    products,


  });

};



///reset product filter///
exports.resetProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;

    
    if (!categoryId) {
      return res.status(400).json({ status: 'error', message: 'Category ID is required' });
    }

    let productquery = productDb.find({ categoryId });

    // Products pagination
    const page = 1; 
    const limit = 20; 

    // Start index
    const skip = (page - 1) * limit;

    // Total products
    const count = await productDb.countDocuments({ categoryId });
    const pageCount = Math.ceil(count / limit);

    productquery = productquery.skip(skip).limit(limit);

    // Await the query
    const products = await productquery;
    res.json({
      status: 'success',
      results: products.length,
      count,
      Pagination: {
        totalProducts: count,
        pageCount,
      },
      message: 'Products fetched successfully with default settings',
      products,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
};




///Update Products///

exports.updateProduct = async (req, res) => {




  try {
    // Extract necessary data from the request
    const { productId } = req.params;
    const { categoryid: newCategoryId } = req.query;



    const {
      productName,
      price,
      discount,
      quantity,
      description,
      type,
      sizes,
      colors,
      brand,


    } = req.body;





    // Upload new images to Cloudinary and update the image URLs

    const file = req.files ? req.files : "";

    const imageUrlList = [];
    for (let i = 0; i < file.length; i++) {
      const locaFilePath = file[i].path;
      const result = await cloudinary.uploader.upload(locaFilePath);
      imageUrlList.push(result.secure_url);
    }
    // Prepare the updated product data based on the fields provided in the request
    const updatedProductData = {};
    if (productName) updatedProductData.productName = productName;
    if (price) updatedProductData.price = price;
    if (discount) updatedProductData.discount = discount;
    if (quantity) updatedProductData.quantity = quantity;
    if (description) updatedProductData.description = description;
    if (type) updatedProductData.type = type;
    if (sizes) updatedProductData.sizes = sizes;
    if (colors) updatedProductData.colors = colors;
    if (brand) updatedProductData.brand = brand;
    if (newCategoryId) updatedProductData.categoryid = newCategoryId;


    // Get the current product data from the database
    const Exsistproduct = await productDb.findById(productId);

    // Filter out the images that are not already in the database
    const newImages = imageUrlList.filter(imageUrl => !Exsistproduct.images.includes(imageUrl));

    // Update the images array only if there are new images
    if (newImages.length > 0) {
      updatedProductData.images = [...Exsistproduct.images, ...newImages];
    }

    const product = await productDb.findByIdAndUpdate(productId, updatedProductData,
      {
        new: true,
        runValidators: true,
      })
    // await categorydb.findOneAndUpdate(
    //   { products: productId },
    //   { $pull: { products: productId } }
    // );


    // await categorydb.findByIdAndUpdate(
    //   newCategoryId,
    //   { $addToSet: { products: productId } }
    // )




    res.status(200).json(product)

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

///delete images//

exports.deleteimages = async (req, res) => {


  try {
    const { productId, imageUrl } = req.body; // Get productId and imageUrl from the request body

    // First, delete the image from Cloudinary
    const publicId = imageUrl.split('/').pop().split('.')[0]; // Extract public ID from the image URL
    await cloudinary.uploader.destroy(publicId); // Delete the image from Cloudinary

    // Next, find the product and remove the image URL from its images array
    const product = await productDb.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Remove the imageUrl from the images array
    const updatedImages = product.images.filter(img => img !== imageUrl);

    // Update the product with the new images array
    product.images = updatedImages;
    await product.save();

    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}





//// single Product Controller
exports.GetSingleProduct = async (req, res) => {
  const { productid } = req.params;
  try {
    const getSingleProduct = await productDb.findOne({ _id: productid });
    res.status(200).json(getSingleProduct);
  } catch (error) {
    res.status(400).json(error);
  }
};

///NEw Arival PRoduct Controler
exports.NewArival = async (req, res) => {
  try {
    const getArivalProduct = await productDb.find().sort({ _id: -1 });
    res.status(200).json(getArivalProduct);
  } catch (error) {
    res.status(400).json(error);
  }
};


///Customer Review Controler//
exports.ProductReview = async (req, res) => {
  const { productid } = req.params;
  const { username, description, rating,avatar } = req.body;

  if (!username || !description || !rating || !productid) {
    res.status(400).json({ error: "All field Require" });
  }
  try {
    const productReviews = new reviewDb({
      userid: req.usermainid,
      productid,
      username,
      description,
      rating,
      avatar
    });
    await productReviews.save(productReviews);

    res.status(200).json(productReviews);
  } catch (error) {
    res.status(400).json(error);
  }
};

////Get Product Review
exports.GetproductReview = async (req, res) => {
  const { productid } = req.params;
  try {
    const getreview = await reviewDb.find({ productid: productid });
    res.status(200).json(getreview);
  } catch (error) {
    res.status(400).json(error);
  }
};

///Delete Product Review///

exports.DeleteproductReview = async (req, res) => {
  const { reviewid } = req.params;
  try {
    const deleteReview = await reviewDb.findByIdAndDelete({ _id: reviewid });
    res
      .status(200)
      .json({ message: "review deleted sucessfully", deleteReview });
  } catch (error) {
    res.status(400).json(error);
  }
};

///add banner Images//
exports.addBannerImages = async (req, res) => {
  const file = req.files ? req.files : "";
  
  try {
    const imageUrlList = [];
    for (let i = 0; i < file.length; i++) {
      const locaFilePath = file[i].path;

      const result = await cloudinary.uploader.upload(locaFilePath);

      imageUrlList.push(result.secure_url)
    }
    const addBanner = new bannerDb({
      images: imageUrlList
    })
    await addBanner.save()
    res.status(200).json(addBanner)

  } catch (error) {
    res.status(400).json(error)
  }
}


///Get banner Images//
exports.getBannerImages = async (req, res) => {
  try {
    const getAllbannerImages = await bannerDb.find();
    res.status(200).json(getAllbannerImages);
  } catch (error) {
    res.status(400).json(error);
  }
}