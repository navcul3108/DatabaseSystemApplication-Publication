const express = require("express");
const editorQuery = require("../data_access/editor_query");
const articleQuery = require("../data_access/article_query");
const reviewerQuery = require("../data_access/reviewer_query");
require("dotenv").config();

var router = express.Router();

const articleStates = articleQuery.articleStates;
const articleResult = articleQuery.articleResult;

router.use((req, res, next)=>{
    if(!req.session.isEditor)
        return next(Error("Bạn không có quyền truy cập trang này"))

    next();
})

// Danh sách các bài báo mà mình chịu trách nhiệm biên tập
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
    let result = await editorQuery.filterArticlesByType(filterState, req.session.ssn);
    if(!result){
        res.status(404).json("Not found");
        return;
    }
    res.status(200).json(JSON.stringify(result));
})

// Phân công các phản biện cho 1 bài báo
router.get("/assign-reviewers-for-an-article", async (req, res)=>{
    const code = req.query.code;
    
    const allReviewerExceptMe = await editorQuery.getAllReviewerExceptMe(req.session.ssn);
    const articleDetail = await articleQuery.getArticle(code);
    const reviewersOfThisArticle =await editorQuery.getReviewersOfAnArticle(code);

    res.render("editor/assign-reviewer", {allReviewer: allReviewerExceptMe, code: code, title: articleDetail.title, reviewers: reviewersOfThisArticle});
})

// Phân công phản biện
router.post("/assign-reviewers-for-an-article", async(req, res)=>{
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
        res.render("success", {message: "Cập nhật phản biện thành công", returnUrl: "/editor/list-articles"});
    else
        res.render("error", {message: "Không thể cập nhật phản biện cho bài báo này"});
})

// Xem chi tiết bài báo mà mình chịu trách nhiệm
router.get("/view-article-detail", async(req, res)=>{
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

    let reviewContents = await editorQuery.getReviewContentOfAnArticle(code);
    let reviewers = await editorQuery.getReviewersOfAnArticle(code);

    for(var i=0; i<reviewContents.length; i++){
        let reviewedCriterias = await reviewerQuery.getAllReviewedCriteriasOfAnArticle(code, reviewContents[i].reviewerSSN);
        reviewContents[i].reviewedCriterias = reviewedCriterias;
    }

    // Các trạng thái có thể chuyển đổi kết tiếp
    const articleStates = articleQuery.articleStates;
    let canUpdateState = false;
    nextPossibleState = [];
    switch(fullProfile.detail.state){
        case articleStates.sending:
            nextPossibleState = [articleStates.reviewing];
            canUpdateState = reviewers.length>0 && reviewers.every(reviewer=> reviewer.ssn!=null)
            break;
        case articleStates.reviewing:
            nextPossibleState = [articleStates.feedbacking];
            canUpdateState = true;
            break;
        case articleStates.feedbacking:
            nextPossibleState = [articleStates.reviewed];
            canUpdateState = reviewContents.every(review=> review.result!=null);
            break;
        case articleStates.reviewed:
            nextPossibleState = [articleStates.published];
            canUpdateState = fullProfile.detail.result != null;
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
                                            allAuthorNames: fullProfile.allAuthorNames,
                                            
                                            editorProfile: fullProfile.editorProfile,
                                            reviewers: reviewers,

                                            reviewContents: reviewContents,
                                            nextPossibleState: nextPossibleState,
                                            canUpdateState: canUpdateState});
})

// Chấp nhận biên tập cho 1 bài báo mới gửi đến tạp chí
router.post("/accept-article", async(req, res)=>{
    const {body} = req;
    const code = body.code;

    const isSuccess = await editorQuery.acceptArticle(code, req.session.ssn);
    if(isSuccess)
        res.render("success", {message: "Bạn đã chấp nhận biên tập cho bài báo này!", returnUrl: "/editor/list-articles"});
    else
        res.render("error", {message: "Không thể chấp nhận cho bài báo này"});
})

// Cập nhật trạng thái cho 1 bài báo mà mình chịu trách nhiệm phản biện
router.post("/update-state", async (req, res)=>{
    const {body} = req;
    const code = body.code;
    const newState = body.state;

    let isValid = false;
    for(key in articleStates)
        isValid =isValid || (articleStates[key]==newState);

    if(!isValid)
    {
        res.render("error", {message: "Có lỗi xảy ra"});
        return;
    }

    const isSuccess = await editorQuery.updateStateOfArticle(code, newState, req.session.ssn);
    if(isSuccess)
        res.render("success", {message: "Bạn đã cập nhật trạng thái bài báo thành công", returnUrl: "/editor/list-articles"});
    else
        res.render("error", {message: "Có lỗi xảy ra"});
})

router.post("/feedback-review", async(req, res)=>{
    const {body} = req;
    const code = body.code;
    const reviewerSSN = body.reviewerSSN;
    const result = body.result;
    const editorSSN = req.session.ssn;

    const isSuccess = await editorQuery.updateReviewResult(code, reviewerSSN, editorSSN, result);
    if(isSuccess)
        res.render("success", {message: "Cập nhật kết quả cho bài phản biện thành công", returnUrl: "/list-articles"});
    else
        res.render("error", {message: "Không thể cập nhật kết quả cho bài phản biện này"});
})

router.post("/update-article-result", async (req, res)=>{
    const {body} = req;
    const result = body.result;
    const note = body.note;
    const notifyDate = new Date();
    const code = body.code;

    let isValid = false;
    for(const [_, val] of Object.entries(articleResult))
        isValid = isValid || (result=== val)
    if(!isValid){
        res.render("error", {message: "Không thể cập nhật kết quả cho bài báo"});
        return;
    }

    const isSuccess = await editorQuery.updateArticleResult(code, req.session.ssn, result, notifyDate, note);
    if(isSuccess)
        res.render("success", {message: "Cập nhật kết quả cho bài báo thành công"});
    else
        res.render("error", {message: "Không thể cập nhật kết quả cho bài báo"});
})
module.exports = router;