const dbUtils = require("./data_access/database_utils");
const articleQuery = require("./data_access/article_query");
const editorQuery = require("./data_access/editor_query");
const reviewerQuery = require("./data_access/reviewer_query");
const authorQuery = require("./data_access/author_query");
var config = {
    server: process.env.localDatabaseServer,
    database: process.env.databaseName,
    driver: "msnodesqlv8",
    options: {
        trustedConnection: false
    },
    user: process.env.tacgialogin,
    password: process.env.tacgiapassword
};

async function foo(){
    try{
        return await reviewerQuery.getReviewOfAnArticle('5555555555', '000444444');
    }
    catch(err){
        console.log(err);
    }
}

foo().then(res=>console.log(res));
