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

const categorySchema = new mongoose.Schema({
    name: String,
    cost: Number,
    recordId: String,
    userId: String
});

const Category = new mongoose.model("Category", categorySchema);


module.exports = {
    Category: Category
}