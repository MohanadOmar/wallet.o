require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const router = express.Router()
const User = require("./authantication").User;

const accountSchema = new mongoose.Schema({
    name: String,
    type: String,
    balance: Number
});

const Account = new mongoose.model("Account", accountSchema);

// New Account Page
router.get("/new-account", function(req, res) {
    if(req.isAuthenticated()){
        res.render("newAccount");
        console.log(User);
    }   else {
        res.redirect("login");
    }
});

router.post("/new-account", function(req, res) {
    const newAccount = new Account({
        name: req.body.name,
        type: req.body.type,
        balance: req.body.balance
    });

    newAccount.save(); 
    
    User.findOne({_id: req.user}).then(foundUser => {
        foundUser.accountsId.push(newAccount._id);
        foundUser.save();
    });
    
    res.redirect("/home");
});


// Delete Account
router.get("/delete-account/:accountId", (req, res) => {
    // Deleteing the account from the User's account
    User.findOne({_id: req.user}).then(foundUser => {
        foundUser.accountsId.forEach(accountId => {
            if(accountId == req.params.accountId) {
                foundUser.accountsId.remove(accountId);
                foundUser.save();
            }
        });
    });

    // Deleteing it from the Accounts collections
    Account.deleteOne({_id: req.params.accountId});

    res.redirect("/home");
});

module.exports = {
    router: router,
    Account: Account
  };
