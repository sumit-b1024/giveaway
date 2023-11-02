const multer = require("multer");


const filefilter = (req, file, cb) => {
  // if(file.mimetype === 'video/mp4' || file.mimetype === 'video/mkv'){
  //     cb(null,true);
  // }else{
  //     cb(null,false);
  // }
  //if (!file.originalname.match(/\.(mp4|webp|MPEG-4|mkv|mov|png|jpg|jpeg)$/)) {
  if (!file.originalname.match(/\.(webp|png|jpg|jpeg)$/)) {
     cb(new Error("Only webp, png, jpg or jpeg image files are allowed"));
  }
  cb(null, true);
};

//upload user images
const userstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/users");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname )
  },
});

//upload user image
const userupload = multer({
  storage: userstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});



//upload category images
const categorystorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/category");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname )
  },
});


//upload category image
const categoryupload = multer({
  storage: categorystorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload admin images
const adminstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/admins");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname )
  },
});


//upload admin image
const adminupload = multer({
  storage: adminstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});

//upload product images
const productstorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/products");
  },
  filename: (req, file, cb) => {
    // cb(
    //   null,
    //   new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname
    // );
    cb(null, Date.now() + '_'+ file.originalname )
  },
});


//upload product image
const productupload = multer({
  storage: productstorage,
  limits: { fieldSize: 25 * 1024 * 1024 },
  fileFilter: filefilter,
});
const noupload = multer().none();
module.exports = { noupload, userupload, categoryupload, adminupload, productupload};
