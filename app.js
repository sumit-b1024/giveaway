var app = require("express")();

var express = require("express");
require("dotenv").config();
var path = require("path");
var http = require("http").Server(app);
var validator = require("express-validator");
const db = require("./database/db"); // Adjust the path as needed
var cors = require("cors");
const passport = require("passport");
const config = require("./config/config");
var TwitterStrategy = require('passport-twitter');  

// import controller
var AuthController = require("./controllers/admin/AuthController");

// import Router file
var pageRouter = require("./routers/route");
var authRouter = require("./routers/AuthRoute");
var userRouter = require("./routers/userRoute");
var adminRouter = require("./routers/adminRoute");
//var giveawayRouter = require("./routers/giveAwayRoute");
var youtubeRouter = require("./routers/YoutubeRoute");

var session = require("express-session");
var bodyParser = require("body-parser");
var flash = require("connect-flash");
var i18n = require("i18n-express");
app.use(bodyParser.json());
app.use(cors());
const tokenBlacklist = new Set();
//app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: "user_sid",
    secret: "somerandonstuffs",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 1200000,
    },
  })
);

app.use(
  session({ resave: false, saveUninitialized: true, secret: "nodedemo" })
);
app.use(flash());
app.use(
  i18n({
    translationsPath: path.join(__dirname, "i18n"), // <--- use here. Specify translations files path.
    siteLangs: ["es", "en", "de", "ru", "it", "fr"],
    textsVarName: "translation",
  })
);

//app.use('/public', express.static('public'));
app.use(express.static(__dirname + "/public"));
app.use("/uploads", express.static("public/uploads"));

// Define middleware to pass common parameters
app.use((req, res, next) => {
  res.locals.SiteTitle = process.env.APP_NAME; // Example common parameter
  res.locals.currentUser = req.session.user; // Example user information
  // You can add more common parameters here as needed
  next();
});

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});


// Twitter Strategy
passport.use(new TwitterStrategy({
  consumerKey: config.twitterAuth.consumerKey,
  consumerSecret: config.twitterAuth.consumerSecret,
  callbackURL: config.twitterAuth.callbackURL
},
function(token, tokenSecret, profile, cb) {
    return cb(err, profile);
  
}
));

app.get("/layouts/", function (req, res) {
  res.render("view");
});

// apply controller
AuthController(app);

//For set layouts of html view
var expressLayouts = require("express-ejs-layouts");
const { error } = require("console");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);

// Define All Route
pageRouter(app);
app.use(authRouter);
app.use(userRouter);
app.use(adminRouter);
//app.use(giveawayRouter);
app.use(youtubeRouter);


app.get("/", function (req, res) {
  res.redirect("/");
});

http.listen(8000, function () {
  console.log("listening on *:8000");
});
