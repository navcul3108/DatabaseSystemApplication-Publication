const express = require("express");
const oktaUtils = require("./okta_utils");
const editorQuery = require("../data_access/editor_query");
require("dotenv").config();

var router = express.Router();

const articleFilterTypes = editorQuery.articleFilterTypes;

router.use((req, res, next)=>{
    if(!req.session.isEditor)
        return next(Error("Bạn không có quyền truy cập trang này"))

    next();
})


router.get("/list-articles", (req, res)=>{
    if(!req.session.isEditor)
    {
        res.render("error", {message: "Bạn không có quyền truy cập trang này"});
        return;
    }

    res.render("editor/list-articles");
})

// ajax method
router.get("/filter-article", async (req, res)=>{
    const filterState = req.query.filterState;
    let result = await editorQuery.filterArticlesByType(filterState);
    if(!result)
        res.status(404).json("Not foudn");
    res.status(200).json(JSON.stringify(result));
})

router.get("/assign-reviewer", async (req, res)=>{
    const code = req.query.code;
    
    const allReviewerExceptMe = await editorQuery.getAllReviewer(req.session.ssn);

    res.render("editor/assign-reviewer", {allReviewer: allReviewerExceptMe});
})

router.post("/accept-article", async(req, res)=>{
    const {body} = req;
    const code = body.code;

    const isSuccess = await editorQuery.acceptArticle(code, req.session.ssn);
    if(isSuccess)
        res.render("success", {message: "Bạn đã chấp nhận biên tập cho bài báo này!", returnUrl: "/editor/list-articles"});
    else
        res.render("error", {message: "Không thể chấp nhận cho bài báo này"});
})
module.exports = router;