const express = require("express");
const oktaUtils = require("./okta_utils");
const articleQuery = require("../data_access/article_query");
const userQuery = require("../data_access/user_query");
const authorQuery = require("../data_access/author_query");
require("dotenv").config();
const userRole = require("../data_access/user_query").userRole;

var router = express.Router();

const roleAlias = {
    author: "author",
    reviewer: "reviewer",
    editor: "editor"
}

const acceptanceRoleAlias = ["author", "reviewer", "editor"]

router.get("/author-articles", async (req, res)=>{
    const currentRole = req.query.currentRole;
    if(!currentRole || !req.session.isAuthor){
        res.render("error", {message: "Bạn không có quyền truy cập trang này", error: {stack: "", status: ""}});
        return;
    }

    if(acceptanceRoleAlias.every(alias => currentRole!==alias))
    {
        res.render("error", {message: "Truy vấn không hợp lệ"});
        return;
    }

    const ssn = req.session.ssn;
    const profileOfArticles = await articleQuery.viewPostedArticle(ssn);
    res.render("article/author-articles", {profileOfArticles: profileOfArticles, currentRole: currentRole});
})

router.get("/article-detail", async (req, res)=>{
    if(!(req.session.isAuthor || req.session.isEditor || req.session.isReviewer)){
        res.render("error", {message: "Bạn không được phép truy cập trang này"});
        return;
    }

    const code = req.query.code;
    const currentRole = req.query.currentRole;

    if(acceptanceRoleAlias.every(roleAlias => roleAlias!=currentRole))
    {
        res.render("error", {message: "Truy vấn không hợp lẹ"});
        return;
    }

    // Lấy thông tin bài báo
    const detail = await articleQuery.getArticle(code);
    if(!detail){
        res.render("error", {message: "Không tòn tại bài báo mà bạn đang tìm kiếm"});
        return;
    }
    
    // Lấy thông tin tác giả liên lạc
    const contactSSN = detail.contactSSN;
    const contactAuthorProfile = await userQuery.getFullName(contactSSN);
    if(!contactAuthorProfile){
        res.render("error", {message: "Có lỗi xảy ra trong quá trình xử lý"});
        return;
    }
    const isContactAuthor = req.session.ssn === contactSSN;

    // lấy thông tin toàn bộ tác giả
    const allAuthorNames = await authorQuery.getAllAuthorsOfAnArticle(code);
    if(!allAuthorNames){
        res.render("error", {message: "Có lỗi xảy ra trong quá trình thực thi"});
        return;
    }

    // Lấy thông tin biên tập
    let editorProfile= null;
    if(detail.editorSSN)
    {
        editorProfile = await userQuery.getFullName(detail.editorSSN);
    }

    let returnReviewContents = []
    let isEditorOfThisArticle = false;
    let isReviewerOfThisArticle = false;
    let nextPossibleState = null;
    if(currentRole===roleAlias.reviewer && req.session.isReviewer){
        // lấy ra nội dung phản biện mà mình đã phản biện cho bài báo này
        const reviewContent = await articleQuery.getReview(code, req.session.ssn);
        if(reviewContent==null){
            res.render("error", {message: "Bạn không có quyền truy cập bài báo mà mình không chịu trách nhiệm phản biện"});
            return;
        }
        returnReviewContents.push(reviewContent);
        isReviewerOfThisArticle = true;
    }
    else if(currentRole==roleAlias.editor && req.session.isEditor){
        // lấy ra toàn bộ nội dung phản biện
        const reviewContents = await articleQuery.getReview(code);
        if(reviewContents==null){
            reviewContents = [];
        }
        returnReviewContents = reviewContents;
        isEditorOfThisArticle = true;
        // Các trạng thái có thể chuyển đổi kết tiếp
        const articleStates = articleQuery.articleStates;
        nextPossibleState = [];
        switch(detail.state){
            case articleStates.sending:
                nextPossibleState = [articleStates.reviewing];
                break;
            case articleStates.reviewing:
                nextPossibleState = [articleStates.feedbacking];
                break;
            case articleStates.feedbacking:
                nextPossibleState = [articleStates.reviewed];
                break;
            case articleStates.reviewed:
                nextPossibleState = [articleStates.published];
                break;
            case articleStates.published:
                nextPossibleState = [articleStates.posted];
                break;
            default: break;
        }
    }

    // res.render("article-detail", {informations: informations});
    let data = { detail: detail, 
                isContactAuthor: isContactAuthor,
                contactAuthorProfile: contactAuthorProfile,
                allAuthorNames: allAuthorNames,
                returnReviewContents: returnReviewContents,
                isEditorOfThisArticle: isEditorOfThisArticle,
                isReviewerOfThisArticle: isReviewerOfThisArticle,
                };
    if(nextPossibleState)
        data.nextPossibleState = nextPossibleState;

    res.render("article/article-detail", data);
})

module.exports = router;