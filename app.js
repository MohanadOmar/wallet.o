require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const shedule = require("node-schedule");
const { Budget } = require('./routers/budgets');
const authantication = require('./routers/authantication').router;
const accounts = require("./routers/accounts").router;
const budgets = require("./routers/budgets").router;
const records = require("./routers/records").router;
const subscription = require("./routers/subscription").router;
const User = require("./routers/authantication").User;
const Record = require("./routers/records").Record;
const Account = require("./routers/accounts").Account;
const Subscription = require("./routers/subscription").Subscription;
const Category = require("./routers/categories").Category;

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(authantication);
app.use(accounts);
app.use(budgets);
app.use(records);
app.use(subscription);

mongoose.connect("mongodb://127.0.0.1:27017/walletOrgnaizerDB", {useNewUrlParser: true});


app.get("/home", (req, res) => {
  if(req.isAuthenticated()){
    var wholeBalance = 0;
    User.findOne({_id: req.user}).then(foundUser => {
      // Calculating user's total balance
      Account.find({_id: foundUser.accountsId}).then(foundAccounts => {
        foundAccounts.forEach(account => {
          wholeBalance += account.balance;
        });
        // Getting User's Budgets
        Budget.find({_id: foundUser.budgetsId}).then(foundBudgets => {
          // Getting User's Records
          Record.find({_id: foundUser.recordsId}).then(foundRecords => {
            // Getting User's Subscriptions
            Subscription.find({_id: foundUser.subscriptionsId}).then(foundSubscriptions => {
              // Getting User's Categories
              Category.find({_id: foundUser.categoriesId}).then(foundCategories => {
                res.render("index", {accounts: foundAccounts, budgets: foundBudgets, wholeBalance: wholeBalance, records: foundRecords, subscriptions: foundSubscriptions, categories: foundCategories, user: foundUser});     
              });
            })
          });
        });
      });

      // -------------- Checking for budget renew date ----------------------
      Budget.find({_id: foundUser.budgetsId}).then(foundBudgets => {
        foundBudgets.forEach(budget => {
          // Checking if the budget in one time or monthly/yearly
          if(budget.period == "oneTime"){
            // Budget is One Time
            if(budget.cost <= 0){
              res.redirect("/delete-budget/" + budget._id)
            };
          } else {
            // Budget is monthly/yearly
            const currentDate = new Date();
            const budgetRenewDate = new Date(budget.startDay + "+03:00");
            
            shedule.scheduleJob(budgetRenewDate, () => {
              Budget.findOne({_id: budget._id}).then(foundBudget => {
                // Checking if it's yearly or monthly
                if(foundBudget.period == "monthly"){
                  budgetRenewDate.setMonth(budgetRenewDate.getMonth() + 1);
                  foundBudget.startDay = budgetRenewDate
                } else if(foundBudget.period == "yearly"){
                  budgetRenewDate.setFullYear(budgetRenewDate.getFullYear() + 1);
                  foundBudget.startDay = budgetRenewDate
                };
                foundBudget.cost = foundBudget.startCost;
                foundBudget.save();
              });
            });
          }
        });
      });
      // ------------------ End of Checking for budgets renew date ----------------------

      // ------------ Checking for subscriptions due date ----------------------
      Subscription.find({_id: foundUser.subscriptionsId}).then(foundSubscriptions => {
        foundSubscriptions.forEach(subscription => {
          const currentDate = new Date();
          const subscriptionDueDate = new Date(subscription.date + "+03:00");

          console.log(subscriptionDueDate);
          console.log(currentDate);

          shedule.scheduleJob(subscriptionDueDate, () => {
            const newRecord = new Record({
                name: subscription.name,
                cost: subscription.cost,
                account: subscription.account,
                budget: subscription.budget,
                date: subscription.date,
                type: "expense",
                category: subscription.category
            });
      
            newRecord.save();
    
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
                } else if(newRecord.type == "income"){
                    foundAccount.balance += newRecord.cost
                    foundAccount.save();
                }
            });
    
            // Subtracting the record cost from the budget
            Budget.findOne({_id: newRecord.budget}).then(foundBudget => {
                if(newRecord.type == "expense") {
                    foundBudget.cost -= newRecord.cost;
                    foundBudget.save();
                } else if(newRecord.type == "income"){
                    foundBudget.cost += newRecord.cost;
                    foundBudget.save();
                }
            });               
          });
        });
      });
      // ------------------ End of Checking for subscriptions due date ----------------------

    });

  } else {
    res.redirect("/login")
  }
});






app.listen(3000, function() {
  console.log("Server started on port 3000.");
});

module.exports = app;