require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const shedule = require("node-schedule");
const { Budget } = require('./budgets');
const router = express.Router()
const User = require("./authantication").User;
const Account = require("./accounts").Account;

const subcsriptionSchema = new mongoose.Schema({
    name: String,
    account: String,
    budget: String,
    cost: Number,
    date: Date,
    category: String,
    repeat: String
});

const Subscription = new mongoose.model("Subscription", subcsriptionSchema);


// New subscription
router.get("/add-subscription", (req, res) => {
    if(req.isAuthenticated()){
        User.findOne({_id: req.user}).then(foundUser => {
            Account.find({_id: foundUser.accountsId}).then(foundAccounts => {
                Budget.find({_id: foundUser.budgetsId}).then(foundBudgets => {
                    res.render("addSubscription", {accounts: foundAccounts, budgets: foundBudgets});
                });
            });
        });

    }else{
        res.redirect("/login")
    };
});

router.post("/add-subscription", (req, res) => {
    // creating the subscription in subscriptions collection
    const newSubscription = new Subscription({
        name: req.body.name,
        account: req.body.account,
        budget: req.body.budget,
        cost: req.body.cost,
        date: req.body.date,
        category: req.body.category,
        repeat: req.body.repeat
    })

    newSubscription.save();

    // adding the subscription to the user's subscriptions
    User.findOne({_id: req.user}).then(foundUser => {
        foundUser.subscriptionsId.push(newSubscription._id);
        foundUser.save();
    });

    // redirecting to the home page
    res.redirect("/home");
});

    




module.exports = {
    router: router,
    Subscription: Subscription 
  };