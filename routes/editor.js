const express = require("express");
const editorQuery = require("../data_access/editor_query");
const articleQuery = require("../data_access/article_query");
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
    if(!result){
        res.status(404).json("Not found");
        return;
    }
    res.status(200).json(JSON.stringify(result));
})

router.get("/assign-reviewer", async (req, res)=>{
    const code = req.query.code;
    
    const allReviewerExceptMe = await editorQuery.getAllReviewerExceptMe(req.session.ssn);
    const articleDetail = await articleQuery.getArticle(code);
    const reviewerOfThisArticle =await editorQuery.getReviewersOfAnArticle(code);

    res.render("editor/assign-reviewer", {allReviewer: allReviewerExceptMe, code: code, title: articleDetail.title, reviewers: reviewerOfThisArticle});
})

router.get("/view-aricle-detail", async(req, res)=>{
    const code = req.query.code;
    if(!code){
        res.render("error", {message: "Truy vấn không hợp lệ"});
        return;
    }

    const fullProfile = await articleQuery.getFullProfileOfArticle(code);

    const isEditorOfThisArticle = fullProfile.detail.editorSSN === req.session.ssn;
    if(!isEditorOfThisArticle)
    {
        res.render("error", {message: "Bạn không phải là biên tập của bài báo này"});
        return;
    }

    let reviewContents = await editorQuery.getReviewsOfAnArticle(code);

    // Các trạng thái có thể chuyển đổi kết tiếp
    const articleStates = articleQuery.articleStates;
    let canUpdateState = false;
    nextPossibleState = [];
    switch(fullProfile.detail.state){
        case articleStates.sending:
            nextPossibleState = [articleStates.reviewing];
            canUpdateState = reviewContents.every(review=> review.reviewerSSN!=null)
            break;
        case articleStates.reviewing:
            nextPossibleState = [articleStates.feedbacking];
            canUpdateState = true;
            break;
        case articleStates.feedbacking:
            nextPossibleState = [articleStates.reviewed];
            canUpdateState = reviewContents.every(review=> review.score!=null);
            break;
        case articleStates.reviewed:
            nextPossibleState = [articleStates.published];
            canUpdateState = detail.result != null;
            break;
        case articleStates.published:
            nextPossibleState = [articleStates.posted];
            canUpdateState = true;
            break;
        case articleStates.posted:
            canUpdateState = false;
            break;
        default: break;
    }

    res.render("article/article-detail",   {currentRole: 'editor',
                                            detail: fullProfile.detail,
                                            contactAuthorProfile: fullProfile.contactAuthorProfile,
                                            allAuthorNames: allAuthorNames,
                                            editorProfile: editorProfile,
                                            reviewContents: reviewContents,
                                            nextPossibleState: nextPossibleState});
})

router.post("/assign-reviewer", async(req, res)=>{
    const {body} = req;
    let reviewerSSNs = body.reviewerSSN;
    let deadlines = body.deadline;
    const code = body.code;
    if(!reviewerSSNs)
        reviewerSSNs =[];
       
    if(!deadlines)
        deadlines = [];    

    if(typeof reviewerSSNs === 'string')
        reviewerSSNs = [reviewerSSNs];

    if(typeof deadlines === 'string')
        deadlines = [deadlines];

    let assignmentDetails = []
    for(var i=0; i<deadlines.length; i++)
        assignmentDetails.push({reviewerSSN: reviewerSSNs[i], deadline: deadlines[i]});

    const isSuccess = await editorQuery.updateReviewers(code, req.session.ssn, assignmentDetails);
    if(isSuccess)
        res.render("success", {message: "Cập nhật phản biện thành công", returnUrl: "/editor/filter-article"});
    else
        res.render("error", {message: "Không thể cập nhật phản biện cho bài báo này"});
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