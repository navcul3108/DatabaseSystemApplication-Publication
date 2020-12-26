const express = require("express");
const oktaUtils = require("./okta_utils");
const reviewerQuery = require("../data_access/reviewer_query");
require("dotenv").config();

var router = express.Router();

router.post("/update-profile", async (req, res)=>{
    const {body} = req;
    const ssn = req.session.ssn;

    if(await reviewerQuery.updateProfile(ssn, body.privateEmail, body.publicEmail, body.level, body.major, body.workingDate))
        res.redirect("back");
    else
        res.render("error");
})

module.exports = router;