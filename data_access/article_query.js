const { post } = require("../routes/author");
const { queryDatabase } = require("./database_utils");
const dbUtils = require("./database_utils");

const articleState = {
    sending: 'DangNop',
    reviewing: 'PhanBien',
    feedbacking: 'PhanHoiPhanBien',
    reviewed: 'HoanTatPhanBien',
    published: 'XuatBan',
    posted: 'DaDang'
}

const genArticleId = async (req, res) => {
    let config = dbUtils.config;
    let login = dbUtils.databaseLogin["Tác giả"];
    config.user = login.user;
    config.password = login.password;

    const sqlStatement = "Select MABAIBAO FROM BAIBAO";
    let articleId = Math.floor(1000000000 + Math.random() * 9000000000);
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    const articleIds = table.rows;
    while (articleIds.some(id => id == articleId))
        articleId = Math.floor(1000000000 + Math.random() * 9000000000);

    return articleId;
}

const postCommonArticle = async (contactSSN, authorSSNs, title, brief, keywords, fileName, sendingDate) => {
    let config = dbUtils.config;
    let login = dbUtils.databaseLogin["Tác giả"];
    config.user = login.user;
    config.password = login.password;
    const articleId = await genArticleId();

    /*Insert into BAIBAO*/
    let sqlStatement = `Insert Into BAIBAO(MABAIBAO, TIEUDE, TOMTAT, FILEBAIBAO, TGLLSSN, NGAYGOI, TRANGTHAI)
                        Values('${articleId}', '${title}', '${brief}', '${fileName}', '${contactSSN}', '${sendingDate}', '${articleState.sending}')`;
    let res = await dbUtils.queryDatabase(config, sqlStatement, "Insert into BAIBAO successfully!");
    if (res) {
        /*Insert into LATACGIA*/
        sqlStatement = authorSSNs.map(ssn => `INSERT INTO LATACGIA(MABAIBAO, TACGIASSN) Values('${articleId}', '${ssn}');`).join('\n');
        console.log(sqlStatement);
        res = await dbUtils.queryDatabase(config, sqlStatement, "Insert into LATACGIA successfuly!");
        if (res) {
            /*Insert into TUKHOA*/
            sqlStatement = keywords.map(key => `INSERT INTO TUKHOA(MABAIBAO, TUKHOA) VALUES('${articleId}', '${key}');`).join('\n');
            res = await dbUtils.queryDatabase(config, sqlStatement, "Insert into TUKHOA successfully!");
            if (res)
                return articleId;
            else
                throw Error("Cannot insert into TUKHOA")
        }
        throw Error("Cannot insert into LATACGIA");
    }
    throw Error("Cannot insert into BAIBAO");
}


const postResearchArticle = async (contactSSN, authorSSNs, title, brief, keywords, fileName, sendingDate) => {
    try {
        let config = dbUtils.config;
        let login = dbUtils.databaseLogin["Tác giả"];
        config.user = login.user;
        config.password = login.password;

        let articleId = await postCommonArticle(contactSSN, authorSSNs, title, brief, keywords, fileName, sendingDate);
        let sqlStatement = `Insert Into NGHIENCUU(MABAIBAO, CHIEUDAI) Values('${articleId}', 15)`;
        const res = await dbUtils.queryDatabase(config, sqlStatement, `Insert into NGHIENCUU successfully`);
        return res;
    }
    catch (err) {
        console.log(err);
        return false;
    }
}

const postOverviewArticle = async (contactSSN, authorSSNs, title, brief, keywords, fileName, sendingDate) => {
    try {
        let config = dbUtils.config;
        let login = dbUtils.databaseLogin["Tác giả"];
        config.user = login.user;
        config.password = login.password;

        let articleId = await postCommonArticle(contactSSN, authorSSNs, title, brief, keywords, fileName, sendingDate);
        let sqlStatement = `Insert Into TONGQUAN(MABAIBAO, CHIEUDAI) Values('${articleId}', 6)`;
        return await dbUtils.queryDatabase(config, sqlStatement, `Insert into TONGQUAN successfully`);
    }
    catch (err) {
        console.log(error);
        return false;
    }
}

const postReviewArticle = async (contactSSN, authorSSNs, title, brief, keywords, fileName, sendingDate, bookName, ISBN, authorNames, publisher, publishYear, numberPage)=>{
    try{
        let config = dbUtils.config;
        let login = dbUtils.databaseLogin["Tác giả"];
        config.user = login.user;
        config.password = login.password;

        let articleId = await postCommonArticle(contactSSN, authorSSNs, title, brief, keywords, fileName, sendingDate);
        
       
        let  sqlStatement = `Insert Into SACH(ISBN, SOTRANG, NAMXUATBAN, NHAXUATBAN, TENSACH) Values('${ISBN}', ${numberPage}, ${publishYear}, '${publisher}', '${bookName}');`;
        let res = await dbUtils.queryDatabase(config, sqlStatement, `Insert into PHANBIENSACH successfully`);
        if(res){
            if(authorNames.length>0){
                sqlStatement = authorNames.map(name => `Insert Into TACGIASACH(ISBN, TACGIA) Values('${ISBN}', '${name}');`).join('\n');
                res = await dbUtils.queryDatabase(config, sqlStatement, "Insert Into TACGIASACH successfully!");
            }
            if(res){
                 /*Insert into PHANBIENSACH */
                sqlStatement = `Insert Into PHANBIENSACH(MABAIBAO, CHIEUDAI, ISBN) Values('${articleId}', 5, '${ISBN}');`;
                res =await dbUtils.queryDatabase(config, sqlStatement, "Insert Into Sach successfully!");
                return res;
            }
            return false;
        }
        return false;
    }
    catch(err){
        console.log(err);
        return false;
    }
}

module.exports = {
    postResearchArticle: postResearchArticle,
    postOverviewArticle: postOverviewArticle,
    postReviewArticle: postReviewArticle
}