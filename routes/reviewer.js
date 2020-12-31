const express = require("express");
const reviewerQuery = require("../data_access/reviewer_query");
const articleStates = require("../data_access/article_query").articleStates;
const articleQuery = require("../data_access/article_query");
require("dotenv").config();

var router = express.Router();

router.use((req, res, next)=>{
    if(!req.session.isReviewer)
    {
        return next(Error("Bạn không phải là phản biện"));
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

    const fullProfile = await articleQuery.getFullProfileOfArticle(code, req.session.user.id);

    if(!fullProfile.editorProfile.ssn)
    {
        res.render("error", {message: "Bài báo này chưa được biên tập nào chấp nhận"});
        return;
    }

    const reviewContent = await articleQuery.getReview(code, req.session.ssn);
    let isEditable = false;
    if(reviewContent!=null){
        const now = new Date();
        const deadline = new Date(reviewContent.deadline);
        isEditable = (fullProfile.detail.state ===  articleStates.reviewing) && (now <= deadline);    
    }
    else if(fullProfile.detail.state== articleStates.reviewing)
        isEditable = true;

    let allCriterias = await reviewerQuery.getAllCriterias();
    const reviewedCriterias = await reviewerQuery.getAllReviewedCriteriasOfAnArticle(code, req.session.ssn);
    
    // Xử lý để show bên client
    reviewedCriterias.forEach(reviewedCriteria=>{
        for(criteriaCode in allCriterias){
            if(allCriterias[criteriaCode].content === reviewedCriteria.content)
                allCriterias[criteriaCode].details = allCriterias[criteriaCode].details.map(detail=> {
                    if(detail.score===reviewedCriteria.score)
                        detail.selected=true;
                    return detail;
                });
        }
    })

    res.render("article/article-detail", {
        currentRole : 'reviewer',
        detail : fullProfile.detail,
        allAuthorNames: fullProfile.allAuthorNames,
        contactAuthorProfile: fullProfile.contactAuthorProfile,
        editorProfile: fullProfile.editorProfile,
        reviewerSSN: req.session.ssn,
        isEditable : isEditable,
        allCriterias: allCriterias,
        reviewedCriterias: reviewedCriterias,
        reviewContent: reviewContent
    })
})

router.get("/view-reviewing-articles", async (req, res)=>{
    const ssn = req.session.ssn;

    const articles = await reviewerQuery.getAllReviewingArticles(ssn);
    res.render("reviewer/reviewing-articles", {articles: articles});
})

router.post("/update-review-content", async (req, res)=>{
    const {body} = req;
    const noteForAuthor = body.noteForAuthor;
    const noteForEditor = body.noteForEditor;
    const content = body.content;
    const code = body.code;
    const reviewerSSN = req.session.ssn;
    const allCriterias = await reviewerQuery.getAllCriterias();

    let criteriaScores = [];
    // Lấy ra toàn bộ điểm đã lựa chọn
    for(criteriaCode in allCriterias){
        if(body[allCriterias[criteriaCode].content])
        {
            criteriaScores.push({code: criteriaCode, score: body[allCriterias[criteriaCode].content]})
        }
    }

    let haveUpdatedScoreOfAnArticle = true;
    for(var i=0; i< criteriaScores.length; i++){
        haveUpdatedScoreOfAnArticle = haveUpdatedScoreOfAnArticle && await reviewerQuery.updateScoreOfArticleBaseOnCriteria(code, reviewerSSN, criteriaScores[i].code, criteriaScores[i].score);
    }
    if(!haveUpdatedScoreOfAnArticle){
        res.render("error", {message: "Không thể cập nhật điểm cho bài phản biện"});
        return;
    }

    const isSuccess = await reviewerQuery.updateOrInsertReviewForAnArticle(code, reviewerSSN, noteForAuthor, noteForEditor, content);
    if(isSuccess)
        res.render("success", {message: "Phản biện thành công"});
    else
        res.render("error", {message: "Có lỗi xảy ra"});
})
module.exports = router;