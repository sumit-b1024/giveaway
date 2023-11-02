
var express = require("express");
var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });

const {noupload, userupload} = require("../middeleware/imageUpload");
const verifyToken = require('../middeleware/verifyToken');



const {
    apiRegister,
    apiProfile,
    apiProfileUpdate,
    apiLogin,
    apiLogout,
    apiChangePassword,
    apiForgotPassword,
    apiUpdatePassword,
    apiEmailVerify,
    apiRegisterWithFacebook,
    apiLoginWithFacebook,
    apiRegisterWithGoogle
   
  } = require("../controllers/api/AuthController");
const passport = require('passport');


  
const router = express.Router();

//router.post("/api/V1/login", noupload, apiLogin);         //for body-form-data
router.post("/api/V1/login", urlencodeParser, apiLogin);  //for body-www-form-urlencoded
router.post("/api/V1/change-password", urlencodeParser, verifyToken, apiChangePassword);
router.get("/api/V1/logout", urlencodeParser, verifyToken, apiLogout);

router.post(
    "/api/V1/register",
    userupload.fields([
      {
        name: "profile_image",
        maxCount: 1,
      },
    ]),
    urlencodeParser,
    apiRegister
  );router.get("/api/V1/verify/:token", urlencodeParser, apiEmailVerify);
router.get("/api/V1/profile", urlencodeParser, verifyToken, apiProfile);
router.post(
  "/api/V1/profile/update",
  userupload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  urlencodeParser,
  verifyToken,
  apiProfileUpdate
);

router.post("/api/V1/forgot-password", urlencodeParser, apiForgotPassword);
router.post("/api/V1/update-password/", urlencodeParser, apiUpdatePassword);

router.post("/api/V1/login-with-facebook-auth", 
  userupload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),
  urlencodeParser, 
  apiRegisterWithFacebook);

  router.post("/api/V1/login-with-google-auth",userupload.fields([
    {
      name: "profile_image",
      maxCount: 1,
    },
  ]),urlencodeParser,apiRegisterWithGoogle)

 

  router.get("/api/V1/LoginWithTwitter", passport.authenticate("twitter"),(req,res)=>{
    console.log("req::::",req)
  });

  router.get(
    "/auth/twitter/callback",
    passport.authenticate("twitter", { failureRedirect: "/" }),
    function (req, res) {
      // Successful authentication, redirect home.
      
      res.redirect("/");
    }
  );

  router.get("/login/twitter",(req,res)=>{
    // console.log("req.profile",req)
   
    res.send("Login to tweeter")
  })
  

module.exports = router;