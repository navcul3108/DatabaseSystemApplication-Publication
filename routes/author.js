const express = require("express");
const authorQuery = require("../data_access/author_query");
const articleQuery = require("../data_access/article_query");
const multer = require("multer");
const fs = require("fs");

const articleStates = articleQuery.articleStates;

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
		const folderDir = `./public/articles/${req.session.user?req.session.user.id+'/':''}`;
		if(!fs.existsSync(folderDir))
			fs.mkdirSync(folderDir);
		cb(null, folderDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const fileName = file.originalname.split(".")[0], extend= file.originalname.split(".")[1];
      cb(null, fileName + '-' + uniqueSuffix + '.' +extend);
    }
})

var upload = multer({dest: "./public/tempor/", storage: storage});
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
    const otherAuthors = await authorQuery.getAllAuthorExceptMe(req.session.ssn);
    res.render("author/post-article", { otherAuthors: otherAuthors });
})

router.post("/post-article", upload.single("articleFile"),async (req, res) => {
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
            const result = await articleQuery.postResearchArticle(contactSsn, authorSSNs, body.title, body.brief, keywords, req.file.filename, sendingDate);
            if (result)
                res.render("success", {message: "Bạn đã đăng bài thành công"});
            else{
				fs.unlinkSync(req.path);
				res.render("error", { message: "Không thể đăng bài", error: { status: "", stack: "" } });
			}
            break;
        }
        case "overview": {
            const result = await articleQuery.postOverviewArticle(contactSsn, authorSSNs, body.title, body.brief, keywords, req.file.filename, sendingDate);
            if (result)
                res.render("success", {message: "Bạn đã đăng bài thành công"});
			else
			{
				fs.unlinkSync(req.path);
				res.render("error", { message: "Không thể đăng bài", error: { status: "", stack: "" } });
			}
            break;
        }
        case "review": {
            const bookName = body.bookName,
                ISBN = body.isbn,
                publisher = body.publisher,
                publishYear = body.publishYear,
                numberPage = body.numberPage;
            let authorNames = body.bookAuthorName;

            if(typeof authorNames === 'string')
                authorNames = [authorNames];


            const result = await articleQuery.postReviewArticle(contactSsn, authorSSNs, body.title, body.brief, keywords, req.file.filename, sendingDate, bookName, ISBN, authorNames, publisher, publishYear, numberPage);
            if (result)
                res.render("success", {message: "Bạn đã đăng bài thành công"});
            else{
				fs.unlinkSync(req.file.path);
				res.render("error", { message: "Không thể đăng bài", error: { status: "", stack: "" } });
            }
            break;
        }
    }
})

router.get("/view-article-detail", async (req, res)=>{
    const code = req.query.code;
    if(!code){
        res.render("error", {message: "Truy vấn không hợp lệ"});
        return;
    }
    const fullProfile = await articleQuery.getFullProfileOfArticle(code, req.session.user.id);

    let isContactAuthor = fullProfile.detail.contactSsn == req.session.ssn;

    let canViewReview = false;
    if(fullProfile.detail.state){
        canViewReview = (fullProfile.detail.state!==articleStates.sending) 
                    && (fullProfile.detail.state!==articleStates.reviewing)
                    && (fullProfile.detail.state!==articleStates.reviewed);
    }
    let reviewContents = [];
    if(canViewReview){
        reviewContents = await authorQuery.getReviewsOfAnArticle(code);
    }

    res.render("article/article-detail", {
        currentRole: "author",
        detail : fullProfile.detail,
        allAuthorNames: fullProfile.allAuthorNames,
        contactAuthorProfile: fullProfile.contactAuthorProfile,
        editorProfile: fullProfile.editorProfile,
        canViewReview: canViewReview,
        reviewContents: reviewContents,
        isContactAuthor: isContactAuthor
    })
})
module.exports = router;