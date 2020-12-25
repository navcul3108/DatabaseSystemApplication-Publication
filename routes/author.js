const express = require("express");
const oktaUtils = require("./okta_utils");
const authorQuery = require("../data_access/author_query");
require("dotenv").config();

var router = express.Router();

router.get("/profile", (req, res)=>{
    
})

module.exports = router;