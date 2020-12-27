const express = require("express");
const authorQuery = require("../data_access/author_query");
const articleQuery = require("../data_access/article_query");
require("dotenv").config();

var router = express.Router();

router.post("/update-profile", async (req, res) => {
    const { body } = req;
    const email = body.email;
    const ssn = req.session.ssn;

    if (await authorQuery.updateProfile(ssn, email))
        res.redirect("back");
    else
        res.render("error");
})

router.get("/post-article", async (req, res) => {
    if (!req.session.isAuthor) {
        let error = { status: "", stack: "" };
        res.render("error", { message: "Bạn không phải là Tác giả", error: error });
    }
    const otherAuthors = await authorQuery.getAllAuthorExceptMySelf(req.session.ssn);
    res.render("author/post-article", { otherAuthors: otherAuthors });
})

router.post("/post-article", async (req, res) => {
    const sendingDate = new Date().toISOString();
    const contactSsn = req.session.ssn;
    const { body } = req;
    const authorSSNs = body.SSNValues.toString().split(',');
    let keywords = body.keyword? body.keyword: [];
    if(typeof keywords === "string")
        keywords = [keywords];

    const type = body.type;

    switch (type) {
        case "research": {
            const result = await articleQuery.postResearchArticle(contactSsn, authorSSNs, body.title, body.brief, keywords, body.file, sendingDate);
            if (result)
                res.render("success", {message: "Bạn đã đăng bài thành công"});
            else
                res.render("error", { message: "Không thể đăng bài", error: { status: "", stack: "" } });
            break;
        }
        case "overview": {
            const result = await articleQuery.postOverviewArticle(contactSsn, authorSSNs, body.title, body.brief, keywords, body.fileName, sendingDate);
            if (result)
                res.render("success", {message: "Bạn đã đăng bài thành công"});
            else
                res.render("error", { message: "Không thể đăng bài", error: { status: "", stack: "" } });
            break;
        }
        case "review": {
            const bookName = body.bookName,
                ISBN = body.isbn,
                publisher = body.publiser,
                publishYear = body.publishYear,
                numberPage = body.numberPage;
            let authorNames = body.bookAuthorName;

            if(typeof authorNames === 'string')
                authorNames = [authorNames];


            const result = await articleQuery.postReviewArticle(contactSsn, authorSSNs, body.title, body.brief, keywords, body.fileName, sendingDate, bookName, ISBN, authorNames, publisher, publishYear, numberPage);
            if (result)
                res.render("success", {message: "Bạn đã đăng bài thành công"});
            else
                res.render("error", { message: "Không thể đăng bài", error: { status: "", stack: "" } });
            break;
        }
    }
})

module.exports = router;