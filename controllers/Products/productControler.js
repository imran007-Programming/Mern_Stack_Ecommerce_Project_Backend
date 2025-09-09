const categorydb = require("../../model/product/ProductategoryModal");
const cloudinary = require("../../cloudinary/cloudinary");
const productDb = require("../../model/product/productModel");
const reviewDb = require("../../model/product/ProductReviewModal");
const fs = require("fs");
const brandDb = require("../../model/product/productBrandmodal");
const { ObjectId } = require("mongodb");
const bannerDb = require("../../model/BannerImages/BannerImages");
const { default: mongoose } = require("mongoose");
const { deleteFromCloudinary } = require("../../cloudinary/cloudinary");
exports.Addcategory = async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    const file = req.file;

    if (!categoryName || !description || !file) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Upload to Cloudinary directly from buffer
    const filename = `category-${Date.now()}-${file.originalname}`;
    const upload = await cloudinary.uploadToCloudinary(file.buffer, filename);

    const existingCategory = await categorydb.findOne({ categoryName });
    if (existingCategory) {
      return res.status(400).json({ error: "This category already exists" });
    }

    const addCategory = new categorydb({
      categoryName,
      description,
      catimage: upload.secure_url, // ✅ now saving the uploaded URL
    });

    await addCategory.save();
    res.status(200).json(addCategory);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

///add a brand
exports.AddBrand = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "All field Required" });
  }

  try {
    const brandfound = await brandDb.findOne({ name });
    if (brandfound) {
      res.status(400).json({
        error: "brand already exsist",
      });
    } else {
      const addBrand = new brandDb({
        name,
      });
      await addBrand.save();
      res.status(200).json(addBrand);
    }
  } catch (error) {
    res.status(400).json(error);
  }
};

///get a brand//
exports.getBrand = async (req, res) => {
  try {
    const getAllbrand = await brandDb.find({});
    res.status(200).json(getAllbrand);
  } catch (error) {
    res.status(400).json(error);
  }
};
///get a single brand//
exports.getsingleBrand = async (req, res) => {
  try {
    const getabrand = await brandDb.findById(req.params.id);
    res.status(200).json(getabrand);
  } catch (error) {
    res.status(400).json(error);
  }
};

///getCategory//
exports.Getcategory = async (req, res) => {
  try {
    const getAllCategory = await categorydb.find({});
    res.status(200).json(getAllCategory);
  } catch (error) {
    res.status(400).json(error);
  }
};

////Addproduct
exports.Addproducts = async (req, res) => {
  const { categoryid } = req.query;
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
  const file = req.files;

  if (
    !productName ||
    !price ||
    !discount ||
    !quantity ||
    !description ||
    !brand ||
    !categoryid ||
    !file
  ) {
    return res
      .status(400)
      .json({ error: "All fields and product images are required" });
  }

  try {
    const imageUrlList = [];

    for (let i = 0; i < file.length; i++) {
      const fileBuffer = file[i].buffer;
      const filename = `product-${Date.now()}-${i}.${file[i].originalname
        .split(".")
        .pop()}`;
      const result = await cloudinary.uploadToCloudinary(fileBuffer, filename);
      imageUrlList.push(result.secure_url);
    }

    // 1. Create new product
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

    const savedProduct = await newProduct.save();

    // 2. Push the product into the category's "products" array
    await categorydb.findByIdAndUpdate(
      categoryid,
      {
        $push: { products: savedProduct },
        $addToSet: { brands: brand },
      },
      { new: true }
    );

    /* Add the product brandDb also */
    // await brandDb.findByIdAndUpdate(
    //   brand,
    //   { $push: { products: savedProduct } },
    //   { new: true }
    // );

    res.status(200).json(savedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.findSimilarProducts = async (req, res) => {
  const { productid } = req.params;

  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(productid)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Find the product by its ID
    const product = await productDb.findById(productid);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Define criteria for finding similar products
    const criteria = {
      categoryid: product.categoryid, // Similar category
      _id: { $ne: new mongoose.Types.ObjectId(productid) }, // Exclude current product
    };

    // Query the database for similar products (limit 5)
    const similarProducts = await productDb.find(criteria).limit(5);

    res.status(200).json(similarProducts);
  } catch (error) {
    console.error("Error finding similar products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

///Delete Products controler
exports.Deleteproducts = async (req, res) => {
  const { productid } = req.params;

  try {
    // Step 1: Find the product to be deleted
    const deletedProduct = await productDb.findById(productid);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productid);

    // Step 2: Remove product from category
    const categoryFound = await categorydb.findOneAndUpdate(
      { "products._id": productObjectId },
      { $pull: { products: { _id: productObjectId } } },
      { new: true }
    );

    if (!categoryFound) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Step 3: Check if the brand still has other products in this category
    const stillHasBrand = await productDb.exists({
      categoryid: categoryFound._id,
      brand: deletedProduct.brand,
      _id: { $ne: productid }, // ignore the one we’re deleting
    });

    if (!stillHasBrand) {
      // Step 4: Remove brand from category if no products left with that brand
      await categorydb.findByIdAndUpdate(categoryFound._id, {
        $pull: { brands: deletedProduct.brand },
      });
    }

    // Step 5: Delete product from productDb
    await productDb.findByIdAndDelete(productid);

    res.status(200).json({
      message: "Product deleted successfully",
      category: categoryFound,
    });
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
    res.status(400).json({ error: error.message });
  }
};

////Get PRoducts
exports.Getproduct = async (req, res) => {
  try {
    let query = {};

    // Filter by category
    if (req.query.categoryId && req.query.categoryId !== "all") {
      query.categoryid = req.query.categoryId;
    }

    // Filter by color
    if (req.query.color) {
      query.color = { $regex: req.query.color, $options: "i" };
    }

    // Filter by brand
    if (req.query.brand) {
      query.brand = { $regex: req.query.brand, $options: "i" };
    }

    // Filter by sizes
    if (req.query.sizes) {
      query.sizes = { $regex: req.query.sizes, $options: "i" };
    }

    // Filter by price range
    if (req.query.price) {
      const [min, max] = req.query.price.split("-").map(Number);
      query.price = { $gte: min, $lte: max };
    }

    // Pagination defaults
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    // Count products with same filter
    const count = await productDb.countDocuments(query);
    const pageCount = Math.ceil(count / limit);

    // Sorting
    let sort = {};
    if (req.query.sortBy === "priceLowToHigh") sort.price = 1;
    else if (req.query.sortBy === "priceHighToLow") sort.price = -1;
    else if (req.query.sortBy === "newest") sort.createdAt = -1;
    else if (req.query.sortBy === "oldest") sort.createdAt = 1;

    // Query DB
    const products = await productDb
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      status: "success",
      results: products.length,
      count,
      pagination: {
        currentPage: page,
        totalPages: pageCount,
        totalProducts: count,
        limit,
      },
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

///reset product filter///
exports.resetProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;

    if (!categoryId) {
      return res
        .status(400)
        .json({ status: "error", message: "Category ID is required" });
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
      status: "success",
      results: products.length,
      count,
      Pagination: {
        totalProducts: count,
        pageCount,
      },
      message: "Products fetched successfully with default settings",
      products,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
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

    const files = req.files || [];
    const imageUrlList = [];

    for (let i = 0; i < files.length; i++) {
      const fileBuffer = files[i].buffer;
      const filename = `product-${Date.now()}-${files[i].originalname}`;
      const result = await cloudinary.uploadToCloudinary(fileBuffer, filename);
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
    const newImages = imageUrlList.filter(
      (imageUrl) => !Exsistproduct.images.includes(imageUrl)
    );

    // Update the images array only if there are new images
    if (newImages.length > 0) {
      updatedProductData.images = [...Exsistproduct.images, ...newImages];
    }

    const product = await productDb.findByIdAndUpdate(
      productId,
      updatedProductData,
      {
        new: true,
        runValidators: true,
      }
    );
    // await categorydb.findOneAndUpdate(
    //   { products: productId },
    //   { $pull: { products: productId } }
    // );

    // await categorydb.findByIdAndUpdate(
    //   newCategoryId,
    //   { $addToSet: { products: productId } }
    // )

    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

///delete images//

exports.deleteimages = async (req, res) => {
  try {
    const { productId, imageUrl } = req.body;

    // Extract public ID properly
    const parts = imageUrl.split("/");
    const fileName = parts.pop().split(".")[0];
    const folderPath = parts.slice(parts.indexOf("productimages")).join("/");
    const publicId = `${folderPath}/${fileName}`;

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId);

    // Update product
    const product = await productDb.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.images = product.images.filter((img) => img !== imageUrl);
    await product.save();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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
  const { username, description, rating, avatar } = req.body;

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
      avatar,
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

exports.GetAllReview = async (req, res) => {
  try {
    const getreview = await reviewDb.find({});
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
    // const imageUrlList = [];
    // for (let i = 0; i < file.length; i++) {
    //   const locaFilePath = file[i].path;

    //   const result = await cloudinary.uploader.upload(locaFilePath);

    //   imageUrlList.push(result.secure_url);
    // }

    const imageUrlList = [];

    for (let i = 0; i < file.length; i++) {
      const fileBuffer = file[i].buffer;
      const filename = `banner-${Date.now()}-${i}.${file[i].originalname
        .split(".")
        .pop()}`;
      const result = await cloudinary.uploadToCloudinary(fileBuffer, filename);
      imageUrlList.push(result.secure_url);
    }

    const addBanner = new bannerDb({
      images: imageUrlList,
    });
    await addBanner.save();
    res.status(200).json(addBanner);
  } catch (error) {
    res.status(400).json(error);
  }
};

///Get banner Images//
exports.getBannerImages = async (req, res) => {
  try {
    const getAllbannerImages = await bannerDb.find({});
    res.status(200).json(getAllbannerImages);
  } catch (error) {
    res.status(400).json(error);
  }
};

exports.deleteBannerimages = async (req, res) => {
  try {
    const { bannerId, imageUrl } = req.body;

    // Extract public ID properly
    const parts = imageUrl.split("/");
    const fileName = parts.pop().split(".")[0];
    const folderPath = parts.slice(parts.indexOf("productimages")).join("/");
    const publicId = `${folderPath}/${fileName}`;

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId);

    // Find banner doc
    const bannerImages = await bannerDb.findById(bannerId);
    if (!bannerImages) {
      return res.status(404).json({ error: "Banner not found" });
    }

    // Remove image from array
    bannerImages.images = bannerImages.images.filter((img) => img !== imageUrl);

    if (bannerImages.images.length === 0) {
      // If no images left → delete the entire doc
      await bannerDb.findByIdAndDelete(bannerId);
      return res.status(200).json({ message: "Banner deleted successfully (no images left)" });
    } else {
      // Otherwise just save updated images
      await bannerImages.save();
      return res.status(200).json({ message: "Image deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
