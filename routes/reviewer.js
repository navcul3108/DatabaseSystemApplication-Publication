const express = require("express");
const reviewerQuery = require("../data_access/reviewer_query");
const articleStates = require("../data_access/article_query").articleStates;
const articleQuery = require("../data_access/article_query");
require("dotenv").config();

var router = express.Router();

router.use((req, res, next)=>{
    if(!req.session.isEditor)
    {
        return next(Error("Bạn không phải là biên tập"));
    }
    return next();  
})

router.post("/update-profile", async (req, res)=>{
    const {body} = req;
    const ssn = req.session.ssn;

    if(await reviewerQuery.updateProfile(ssn, body.privateEmail, body.publicEmail, body.level, body.major, body.workingDate))
        res.redirect("back");
    else
        res.render("error");
})

router.get("/view-article-detail", async (req, res)=>{
    const code = req.query.code;
    if(!code){
        res.render("error", {message: "Truy vấn không hợp lệ"});
        return;
    }

    const fullProfile = await articleQuery.getFullProfileOfArticle(code);

    if(!fullProfile.editorProfile.ssn)
    {
        res.render("error", {message: "Bài báo này chưa được biên tập nào chấp nhận"});
        return;
    }

    const reviewContent = await articleQuery.getReview(code, req.session.ssn);
    if(reviewContent==null){
        res.render("error", {message: "Bạn không có quyền truy cập bài báo mà mình không chịu trách nhiệm phản biện"});
        return;
    }

    const now = new Date();
    const deadline = new Date(reviewContent.deadline);
    const isEditable = (fullProfile.detail.state ===  articleStates.reviewing) && (now.getDate() <= deadline.getDate());
    let allCriterias = null;
    if(isEditable){
        allCriterias = await reviewerQuery.getAllCriterias();
    }

    res.render("article/article-detail", {
        currentRole : 'reviewer',
        detail : fullProfile.detail,
        allAuthorNames: allAuthorNames,
        editorProfile: editorProfile,
        isEditable : isEditable,
        allCriterias: allCriterias,
        reviewContent: reviewContent
    })
})

module.exports = router;