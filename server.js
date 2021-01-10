/* Author: Naveed Sheikh
   Revision History:
   01/06/2020 - Initial Commit
*/

/* #region REQUIRES */
var express = require("express");
var app = express();
const hbs = require("express-handlebars");
var multer = require("multer");
var bodyParser = require("body-parser");
var path = require("path");
var mongoose = require("mongoose");
var PhotoModel = require("./models/photoModel");
var UsrModel = require("./models/userModel");
const PHOTODIRECTORY = "./public/photos/";
const clientSessions = require("client-sessions");
var _ = require ("underscore");
var fs = require("fs");
var bcrypt = require('bcryptjs');
require('dotenv').config();
var HTTP_PORT = process.env.PORT || 8080;
/* #endregion */

/* #region CONFIGURATIONS */

// create the photos folder in public directory if it doesn't already exist
//if (!fs.existsSync(PHOTODIRECTORY)) {
//    fs.mkdirSync(PHOTODIRECTORY);
//}

// declaration for serving static files in express 
app.use(express.static('views'));
app.use(express.static('public'));

// setting engine to use handlebars extension
app.engine('.hbs', hbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

// multer storage
const STORAGE = multer.diskStorage({
    destination: PHOTODIRECTORY,
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// setting multer storage location and limits
const UPLOAD = multer({storage: STORAGE, limits : { files: 10 }});

// connection to mongoDB Atlas database (Database URL stored in dotenv file)
mongoose.connect(process.env.DB_URL, {useNewUrlParser: 
    true, useUnifiedTopology: true } )

// client session
app.use(clientSessions({
  cookieName: "session",
  secret: process.env.SESSION_SECRET,
  duration: 20*60*100,
  activeDuration: 5*1000*60
}));

app.use(bodyParser.urlencoded({extended: false}));

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}
/* #endregion */

/* #region SECURITY */
function checkLogin(req, res, next) {
  if(!req.session.user){
      res.redirect("/login");
  }
  else{
      next();
  }
};
/* #endregion */

/* #region ROUTES */
app.get("/upload", checkLogin, function(req,res){
  res.render("upload", {user: req.session.user, layout: false});
});

 app.get("/",function(req,res){
   // only getting public photos from database
    PhotoModel.find({private: 'off'})
        .lean()
        .exec()
        .then((photos) =>{
            _.each(photos, (photo) => {
                // converting date to a format that is easier to read
                photo.uploadDate = new Date(photo.uploadedOn).toDateString();       
            });
            res.render("gallery", {photos: photos, hasPhotos: !!photos.length, user: req.session.user, layout: false});
        });
});

app.get("/privateGallery",function(req,res){
  // only getting private photos from database
   PhotoModel.find({owner: req.session.user.username})
       .lean()
       .exec()
       .then((photos) =>{
           _.each(photos, (photo) => {
               // converting date to a format that is easier to read
               photo.uploadDate = new Date(photo.uploadedOn).toDateString();       
           });
           res.render("privateGallery", {photos: photos, hasPhotos: !!photos.length, user: req.session.user, layout: false});
       });
});

app.get("/register",function(req,res){
  res.render('register', {user: req.session.user, layout: false});
});

app.post("/register", (req, res) =>{
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const username = req.body.username;
  const password = req.body.password;
  UsrModel.findOne({userName: username})
  .exec()
  .then((user) => {
      if(firstname === "" || lastname === "" || username === "" || password === ""){
          return res.render("register", {errorMsg: "All fields are required!", user: req.session.user, layout: false});
      }  
      else if(user){
          return res.render("register", {errorMsg: "Username must be unique. Username is already taken.", user: req.session.user, layout: false});
      }
      else{
          let hash = bcrypt.hashSync(req.body.password, 10);
          var user = new UsrModel({
              firstName: req.body.firstname,
              lastName: req.body.lastname,
              userName: req.body.username,
              password: hash
          });
          user.save((err) => {
              if(err){
                  console.log("There was an error creating");
                  console.log(err);
              } 
              else{
                  console.log("User was saved!");
                          
                  req.session.user = {
                      firstname: user.firstName,
                      lastname: user.lastName,
                      username: user.userName
                  };
                  res.redirect("/dashboard");
              }
          });
      }
  })
})

app.get("/login", (req,res) =>{
  res.render("login",{user: req.session.user, layout:false});
})

app.post("/login", (req,res) =>{
  const username = req.body.username;
  const password = req.body.password;
  UsrModel.findOne({userName: username})
  .exec()
  .then((user) => {
      if(username === "" || password === ""){
          return res.render("login", {errorMsg: "Both fields are required!", user: req.session.user, layout: false});
      }
      if(!user){
          console.log("The user could not be found!");
          return res.render("login", {errorMsg: "Username or password is incorrect, please try again!", user: req.session.user, layout: false});
      }
      else{
          if (username === user.userName && bcrypt.compare(password,user.password)){
              req.session.user = {
                  firstname: user.firstName,
                  lastname: user.lastName,
                  username: user.userName
              };
              res.redirect("/dashboard");
          }
      }
  })
  .catch((err) => {console.log("An error occurred: ${err}")});    
});

app.get("/dashboard", checkLogin, (req,res) =>{
  res.render("dashboard", {user: req.session.user, layout: false});
})

app.get("/logout", (req,res) =>{
  req.session.reset();
  res.redirect("/");
})

app.post("/add", checkLogin, UPLOAD.array("photos", 10),(req,res) => {
  var m_owner = "none";
  if (req.session.user){
    m_owner = req.session.user.username;
  }
  if (req.files < 1){
    return res.render("upload", {errorMsg: "Must select an image to upload", user: req.session.user, layout: false});
  }
  if (req.files.length >= 10){
    return res.render("upload", {errorMsg: "Cannot upload more than 10 images at a time", user: req.session.user, layout: false});
  }
  else {
    for (var file of req.files ){
      const FORM_FILE = file;
      var picture = FORM_FILE.filename;
      const photo = new PhotoModel({
          filename: picture,
          private: req.body.private,
          owner: m_owner
      });
      photo.save((err)=>{
          if(err) {
              console.log("There was an error saving the photo.");
          }
      });
     }
      res.redirect("/privateGallery");
  }
});

app.post("/remove/:filename", (req, res) => {
    // using the url to contain the filename of the photo we
    // want to remove. The :filename part of the url is a dynamic parameter
    // req.params holds the dynamic parameters of a url
    const filename = req.params.filename; 
    // remove the photo 
    PhotoModel.remove({filename: filename}) 
    .then(() => { 
      //remove the file from the file system. 
      fs.unlink(PHOTODIRECTORY + filename, (err) => { 
        if (err) { 
          return console.log(err); 
        } 
        console.log("Removed file : " + filename); 
      });  
      // redirect to the photo gallery once the removal is done. 
      return res.redirect("/privateGallery"); 
    }).catch((err) => { 
      // if there was an error removing the photo, log it, and redirect. 
      console.log(err); 
      return res.redirect("/privateGallery"); 
    }); 
  }); 

app.post("/remove-all", (req, res) => {
  // find all images owned by current user and delete them from the directory
  PhotoModel.find({owner: req.session.user.username})
  .lean()
  .exec()
  .then((photos) =>{
  _.each(photos, (photo) => {
    fs.unlink(path.join(PHOTODIRECTORY, photo.filename), err => {
      if (err) throw err;
    });
  });

  // find all photo documents owned by current user and delete them from collection
  PhotoModel.deleteMany({owner: req.session.user.username})
  .then(() => {
    // redirect to the photo gallery once the removal is done.
    return res.redirect("/privateGallery");
  }).catch((err) => {
      // if there was an error removing the photo, log it, and redirect.
      console.log(err);
      return res.redirect("/privateGallery");
    });
  });
});
/* #endregion */

// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);