const dbUtils = require("./database_utils");
require("dotenv").config();

var config = {
    server: process.env.localDatabaseServer,
    database: process.env.databaseName,
    driver: "msnodesqlv8",
    options: {
        trustedConnection: false
    },
    user: process.env.bientaplogin,
    password: process.env.bientappassword
};

const articleFilterTypes = {
    haveNotEditor: "haveNotEditor",
    haveNotAnyReviewer: "haveNotAnyReviewer",
    sending: "sending",
    reviewing: "reviewing",
    feedbacking: "feedbacking",
    reviewed: "reviewed",
    published: "published",
    posted: "posted"
}

const updateProfile = async (ssn, email)=>{
    const sqlStatement =    `Update BIENTAP
                            Set EMAIL = '${email}' 
                            Where SSN = '${ssn}';`;
    const successMsg = "Update BIENTAP profile successfully";
    return await dbUtils.queryDatabase(config, sqlStatement, successMsg);
}

const getProfile = async (ssn)=>{
    const sqlStatement = `Select EMAIL From BIENTAP WHERE SSN='${ssn}';`;
    
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length >0)
        return {email: table.rows[0][0]}
    return null;
}

const filterArticlesByType = async (type, editorSSN)=>{
    let sqlStatement = "";
    switch(type){
        case articleFilterTypes.haveNotEditor:
            sqlStatement = "Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI From BAIBAOVALOAI WHERE BIENTAPSSN IS NULL;"
            break;
        case articleFilterTypes.haveNotAnyReviewer:
            sqlStatement = "Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI From BAIBAOVALOAI WHERE BIENTAPSSN IS NOT NULL AND MABAIBAO NOT IN (SELECT MABAIBAO FROM PHANCONG);"
            break;        
        case articleFilterTypes.sending:
            sqlStatement = `Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI 
                            From BAIBAOVALOAI 
                            WHERE BIENTAPSSN IS NOT NULL 
                                AND MABAIBAO NOT IN (SELECT MABAIBAO FROM PHANCONG)
                                AND TRANGTHAI = 'DangNop';`;
            break;
        case articleFilterTypes.reviewing:
            sqlStatement = `Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI From BAIBAOVALOAI WHERE TRANGTHAI = 'PhanBien' AND BIENTAPSSN='${editorSSN}';`;
            break;
        case articleFilterTypes.feedbacking:
            sqlStatement = `Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI From BAIBAOVALOAI WHERE TRANGTHAI = 'PhanHoiPhanBien' AND BIENTAPSSN='${editorSSN}';`;
            break;
        case articleFilterTypes.reviewed:
            sqlStatement = `Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI From BAIBAOVALOAI WHERE TRANGTHAI = 'HoanTatPhanBien' AND BIENTAPSSN='${editorSSN}';`;
            break;    
        case articleFilterTypes.published:
            sqlStatement = `Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI From BAIBAOVALOAI WHERE TRANGTHAI = 'XuatBan' AND BIENTAPSSN='${editorSSN}';`;
            break;    
        case articleFilterTypes.posted:
            sqlStatement = `Select MABAIBAO, TIEUDE, NGAYGOI, LOAIBAIBAO, TRANGTHAI From BAIBAOVALOAI WHERE TRANGTHAI = 'DaDang' AND BIENTAPSSN='${editorSSN}';`;
            break;
        default:
            return null;
    }
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true)
    if(table.rows.length>0){
        let articles = [];
        table.rows.forEach(row=>{
            articles.push({code: row[0], title: row[1], sendingDate: new Date(row[2]).toLocaleDateString(), type: row[3], state: row[4]});
        })
        return articles;
    }
    return [];
}

const acceptArticle = async (code, editorSSN) =>{
    const sqlStatement = `Update BAIBAO SET BIENTAPSSN='${editorSSN}' WHERE MABAIBAO='${code}' AND BIENTAPSSN IS NULL  AND TRANGTHAI='DangNop';`

    return await dbUtils.queryDatabase(config, sqlStatement, "");
}

const getAllReviewer = async (editorSSN)=>{
    const sqlStatement = `Select N.SSN, HO+' '+TEN From NHAKHOAHOC N JOIN PHANBIEN P ON N.SSN=P.SSN WHERE N.SSN!= '${editorSSN}';`

    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0){
        let result = []
        table.rows.forEach(row=>{
            result.push({ssn: row[0], fullName: row[1]})
        })
        return result;
    }
    return [];
}

module.exports = {
    updateProfile: updateProfile,
    getProfile: getProfile,
    articleFilterTypes: articleFilterTypes,
    filterArticlesByType: filterArticlesByType,
    acceptArticle: acceptArticle,
    getAllReviewer: getAllReviewer
}