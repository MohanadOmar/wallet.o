require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { route } = require('./budgets');
const { Subscription } = require('./subscription');
const router = express.Router()
const User = require("./authantication").User;
const Account = require("./accounts").Account;
const Budget = require("./budgets").Budget;
const Category = require("./categories").Category;

const recordSchema = new mongoose.Schema({
    name: String,
    cost: Number,
    account: String,
    budget: String,
    date: Date,
    type: String,
    category: String
});

const Record = new mongoose.model("Record", recordSchema);


// New record page
router.get("/new-record", (req, res) => {
    if(req.isAuthenticated()) {
        User.findOne({_id: req.user}).then(foundUser => {
            Account.find({_id: foundUser.accountsId}).then(userAccounts => {
                Budget.find({_id: foundUser.budgetsId}).then(userBudgets => {
                    res.render("newRecord", {accounts: userAccounts, budgets: userBudgets});
                });
            });
        });
    }  else{
        res.redirect("login");
    };
});


router.post("/new-record", (req, res) => {
    const newRecord = new Record({
        name: req.body.name,
        cost: req.body.cost,
        account: req.body.account,
        budget: req.body.budget,
        date: req.body.date,
        type: req.body.type,
        category: req.body.category
    });

    newRecord.save();

    // Adding the category to the user
    const newCategory = new Category({
        name: newRecord.category,
        cost: newRecord.cost,
        recordId: newRecord._id,
        userId: req.user
    });

    
    User.findOne({_id: req.user}).then(foundUser => {
        Category.findOne({name: newCategory.name, userId: foundUser._id}).then(foundCategory => {
            console.log(foundCategory);
            if(foundCategory){
                foundCategory.cost += newCategory.cost;
                foundCategory.save();
                foundUser.categoriesId.push(foundCategory._id);
                foundUser.save();
            } else{
                newCategory.save();
                foundUser.categoriesId.push(newCategory._id);
                foundUser.save();
            };
        });
    });

    // Adding the new record to the user records
    User.findOne({_id: req.user}).then(foundUser => {
        foundUser.recordsId.push(newRecord._id);
        foundUser.save();
    });

    // Subtracting the record cost from the account
    Account.findOne({_id: newRecord.account}).then(foundAccount => {
        if(newRecord.type == "expense") {
            foundAccount.balance -= newRecord.cost
            foundAccount.save();
        }   else if(newRecord.type == "income"){
            foundAccount.balance += newRecord.cost
            foundAccount.save();
        }

    });

    // Subtracting the record cost from the budget
    if(req.body.budget != "none") {
        Budget.findOne({_id: newRecord.budget}).then(foundBudget => {
            if(newRecord.type == "expense") {
                foundBudget.cost -= newRecord.cost;
                foundBudget.save();
            }   else if(newRecord.type == "income"){
                foundBudget.cost += newRecord.cost;
                foundBudget.save();
            }
        });
    }

    res.redirect("/home")
});


// Delete Record
router.get("/delete-record/:recordId", (req, res) => {
    // Removing the record from the user's records
    User.findOne({_id: req.user}).then(foundUser => {
        foundUser.recordsId.forEach(recordId => {
            if(recordId == req.params.recordId) {
                foundUser.recordsId.remove(recordId);
                foundUser.save();
            }
        });

    });

    Record.findOne({_id: req.params.recordId}).then(foundRecord => {
        // Adding Back the record cost to the account
        Account.findOne({_id: foundRecord.account}).then(foundAccount => {
            if(foundRecord.type == "expense") {
                foundAccount.balance += foundRecord.cost
                foundAccount.save();
            }   else if(foundRecord.type == "income"){
                foundAccount.balance -= foundRecord.cost
                foundAccount.save();
            }
        });
        // Adding back the record cost to the budget
        if(foundRecord.budget != "none") {
            Budget.findOne({_id: foundRecord.budget}).then(foundBudget => {
                if(foundRecord.type == "expense") {
                    foundBudget.cost += foundRecord.cost;
                    foundBudget.save();
                }   else if(foundRecord.type == "income"){
                    foundBudget.cost -= foundRecord.cost;
                    foundBudget.save();
                }
            });
        };

        // Deleting the record from the data analysis
        User.findOne({_id: req.user}).then(foundUser => {
            // Category.findOne({name: foundRecord.category, userId: foundUser._id}).then(mainCategory => {
                console.log(req.params.recordId);
                Category.findOne({recordId: req.params.recordId}).then(foundCategory => {
                    console.log(foundCategory);
                    foundCategory.cost -= foundRecord.cost;
                    foundCategory.save();
                    if(foundCategory.cost == foundRecord.cost) {
                        foundUser.categoriesId.remove(foundCategory._id);
                        foundUser.save();
                    }
                });
            // });
        });
        // User.findOne({_id: req.user}).then(foundUser => {
        //     Category.findOne({_id: foundUser._id}).then(foundCategory => {
        //         foundUser.categoriesId.forEach(categoryID => {
        //             if(categoryID == foundCategory._id) {
        //                 foundUser.categoriesId.remove(categoryID);
        //                 foundUser.save();
        //                 Category.deleteOne({_id: foundUser.categoryID});
        //             };
        //         });
        //     });
        // });

        User.findOne({_id: req.user}).then(foundUser => {
            Category.findOne({recordId: foundRecord._id}).then(foundCategory => {
                if(foundCategory) {
                    console.log("Found Category: " + foundCategory);
                    foundCategory.cost -= foundRecord.cost
                    foundCategory.save();
                    Category.deleteOne({recordId: foundRecord._id});
                    foundUser.categoriesId.remove(foundCategory._id);
                    foundUser.save();
                }
            });
        });

    });

    // Deleting the record
    Record.deleteOne({_id: req.params.recordId});
    res.redirect("/home")
});




module.exports = {
    router: router,
    Record: Record,
};