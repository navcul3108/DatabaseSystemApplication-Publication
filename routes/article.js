const express = require("express");
const oktaUtils = require("./okta_utils");
const articleQuery = require("../data_access/article_query");
require("dotenv").config();
const userRole = require("../data_access/user_query").userRole;

var router = express.Router();

router.get("/posted-article", (req, res)=>{
    const currentRole = req.query.currentRole;
    if(!currentRole || !req.session.isAuthor)
        res.render("error", {message: "Bạn không có quyền truy cập trang này", error: {stack: "", status: ""}});

    const ssn = req.session.ssn;
        
    
})


module.exports = router;