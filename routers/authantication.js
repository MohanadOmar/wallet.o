require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const router = express.Router()

router.use(passport.initialize());
router.use(passport.session());

const userSchema = new mongoose.Schema ({
    name: String,
    email: String,
    password: String,
    googleId: String,
    accountsId: [],
    budgetsId: [],
    subscriptionsId: [],
    recordsId: [],
    categoriesId: []
});
  
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
  
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});


// Register
router.get("/register", function(req, res){
    res.render("register");
  });
  
router.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/home");
        });
      }
    });
  
});


// Login
router.get("/login", function(req, res){
  if(req.isUnauthenticated()){
    res.render("login", {err: ""});
  }  else{
    res.redirect("/home")
  }
});

router.post('/login', function(req, res, next) {
  /* look at the 2nd parameter to the below call */
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      return next(err); 
    }
    if (!user) { 
      return res.render('login', {err: "wrong email or password (Unauthorized Login)"}); 
    }
    req.logIn(user, function(err) {
      if (err) { 
        return next(err); 
      }
      return res.redirect("/home");
    });
  })(req, res, next);
});


// Logout
router.get("/logout", function(req, res){
  req.logout(function(err) {
    if (err) { 
      return next(err); 
    }
    res.redirect('/login');
  });
});


// Google Auth
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/home",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);

  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

router.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

router.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/home");
});



module.exports = {
  router: router,
  User: User
};