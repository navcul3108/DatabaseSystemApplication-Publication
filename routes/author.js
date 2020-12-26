const express = require("express");
const oktaUtils = require("./okta_utils");
const userQuery = require("../data_access/user_query");
const authorQuery = require("../data_access/author_query");
require("dotenv").config();

var router = express.Router();

router.post("/update-profile", async (req, res)=>{
    const {body} = req;
    const email = body.email;
    const ssn = req.session.ssn;

    if(await authorQuery.updateProfile(ssn, email))
        res.redirect("back");
    else
        res.render("error");
})

module.exports = router;