const dbUtils = require("./database_utils");

const articleStates = {
    sending: 'DangNop',
    reviewing: 'PhanBien',
    feedbacking: 'PhanHoiPhanBien',
    reviewed: 'HoanTatPhanBien',
    published: 'XuatBan',
    posted: 'DaDang'
}

const articleTypes = {
    overview: "TONGQUAN",
    research: "NGHIENCUU",
    review: "PHANBIENSACH"
}

const articleResult = {
    rejection:'rejection',
    minorRevision: 'minor revision',
    majorRevision: 'major revision',
    acceptance:'acceptance'
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
                        Values('${articleId}', '${title}', '${brief}', '${fileName}', '${contactSSN}', '${sendingDate}', '${articleStates.sending}')`;
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

const viewPostedArticle = async (ssn) =>{
    let config = dbUtils.config;
    let login = dbUtils.databaseLogin["Tác giả"];
    config.user = login.user;
    config.password = login.password;

    const procedureName = 'VIEW_BAIBAO_CUA_BAN_THAN';
    const params = {"TACGIASSN": ssn};
    const table = await dbUtils.execProcedure(config, procedureName, params, "", true);
    if(table.rows.length>0){
        let result = [];
        table.rows.forEach(row=>{
            result.push({code: row[0],
                        title: row[1],
                        contactAuthorName: row[3],
                        state: row[2],
                        reviewerName: row[4]});
        });
        return result;
    }
    return [];
}

const getArticle = async (code)=>{
    let config = dbUtils.config;
    let login = dbUtils.databaseLogin["Tác giả"];
    config.user = login.user;
    config.password = login.password;

    const sqlStatement = `Select * From BAIBAOVALOAI WHERE MABAIBAO='${code}'`;
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0){
        const row = table.rows[0];
        let result = {
            code: row[0],
            title: row[1],
            brief: row[2],
            fileName: row[3],
            filePath: row[4]+'/'+row[3],
            editorSSN: row[5],
            state: row[9],
            result: row[10],
            sendingDate: new Date(row[6]).toLocaleDateString(),
            contactSSN: row[4],
            type: row[8]
        }
        switch(result.type){
            case articleTypes.research:
                result.type = "Nghiên cứu"
                break;
            case articleTypes.overview:
                result.type = "Tổng quan"
                break;
            case articleTypes.review:
                result.type = "Phản biện sách"
                break;
            default: break;
            }
        return result;
    }
    else
        return null;
}

const getReview = async(code, reviewerSSN=null)=>{
    let config = dbUtils.config;
    let login = dbUtils.databaseLogin["Phản biện"];
    config.user = login.user;
    config.password = login.password;
    const sqlStatement = `Select * From BAIPHANBIEN WHERE MABAIBAO='${code}' ${reviewerSSN? `and PHANBIENSSN='${reviewerSSN}'`:''};`;

    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0){
        if(reviewerSSN){
            const row = table.rows[0];
            return {code: row[0], reviewerSSN: row[2], noteForEditor: row[3], noteForAuthor: row[4], content: row[5]}    
        }
        else{
            let result = [];
            const rows = table.rows;
            rows.forEach(row => {
                result.push({code: row[0], reviewerSSN: row[2], noteForEditor: row[3], noteForAuthor: row[4], content: row[5]});
            });
            return result;
        }
    }
    else
        return null;    
}

const getFullProfileOfArticle = async (code) =>{
    const detail = await articleQuery.getArticle(code);
    if(!detail){
        return null;
    }

    const contactSSN = detail.contactSSN;
    const contactAuthorProfile = await userQuery.getFullName(contactSSN);
    if(!contactAuthorProfile){
        return null;
    }

    const allAuthorNames = await authorQuery.getAllAuthorsOfAArticle(code);
    if(!allAuthorNames){
        allAuthorNames = [];
    }

    let editorProfile= null;
    if(detail.editorSSN)
    {
        editorProfile = await userQuery.getFullName(detail.editorSSN);
    }
    else
        editorProfile = null;
    
    return {detail: detail,
            contactAuthorProfile: contactAuthorProfile,
            allAuthorNames: allAuthorNames,
            editorProfile: editorProfile };
}

module.exports = {
    postResearchArticle: postResearchArticle,
    postOverviewArticle: postOverviewArticle,
    postReviewArticle: postReviewArticle,
    viewPostedArticle: viewPostedArticle,
    getArticle: getArticle,
    getReview: getReview,
    articleStates: articleStates,
    getFullProfileOfArticle: getFullProfileOfArticle
}