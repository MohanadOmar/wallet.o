require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const router = express.Router()
const User = require("./authantication").User;
const Account = require("./accounts").Account;

const budgetSchema = new mongoose.Schema({
    name: String,
    account: Object,
    startCost: Number,
    cost: Number,
    period: String,
    startDay: Date
});

const Budget = new mongoose.model("Budget", budgetSchema);

// New Budget Page
router.get("/new-budget", function(req, res) {
    if(req.isAuthenticated()){
        User.findOne({_id: req.user}).then(foundUser => {
            Account.find({_id: foundUser.accountsId}).then(userAccounts => {
                res.render("newBudget", {accounts: userAccounts})    
            });
        });
    }else {
        res.redirect("login");
    }
});

router.post("/new-budget", function(req, res) {
    const newBudget = new Budget({
        name: req.body.name,
        account: req.body.type,
        startCost: req.body.cost,
        cost: req.body.cost,
        period: req.body.period,
        startDay: req.body.startDay
    });

    newBudget.save(); 
    
    User.findOne({_id: req.user}).then(foundUser => {
        foundUser.budgetsId.push(newBudget._id);
        foundUser.save();
    });
    
    res.redirect("/home");
});


// Delete Budget
router.get("/delete-budget/:budgetId", (req, res) => {
    Budget.deleteOne({_id: req.params.budgetId});
    User.findOne({_id: req.user}).then(foundUser => {
        foundUser.budgetsId.forEach(budgetId => {
            if(budgetId == req.params.budgetId) {
                foundUser.budgetsId.remove(budgetId);
                foundUser.save();
            }
        });
    });
    res.redirect("/home");
});


module.exports = {
    router: router,
    Budget: Budget
  };
