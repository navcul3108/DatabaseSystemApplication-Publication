const express = require("express");
const oktaUtils = require("./okta_utils");
const reviewerQuery = require("../data_access/reviewer_query");
require("dotenv").config();

var router = express.Router();


module.exports = router;