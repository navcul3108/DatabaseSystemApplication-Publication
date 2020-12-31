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
                            WHERE BIENTAPSSN = '${editorSSN}'
                                AND MABAIBAO IN (SELECT MABAIBAO FROM PHANCONG)
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

const getAllReviewerExceptMe = async (editorSSN)=>{
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

const getReviewersOfAnArticle = async (code)=>{
    const sqlStatement = `Select SSN, HO+' '+TEN, HANGOI From PHANCONG P Left JOIN NHAKHOAHOC N ON P.PHANBIENSSN = N.SSN WHERE MABAIBAO='${code}';`;

    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0)
    {
        let reviewerDetail = [];
        table.rows.forEach(row=>{
            reviewerDetail.push({ssn: row[0], fullName: row[1], deadline: new Date(row[2]).toISOString()});
        });
        return reviewerDetail;
    }
    return [];
}

const updateReviewers = async (code, editorSSN, assignmentDetails) =>{
    // reviewerDetails: [{reviewerSSN:"", deadline: ""}]
    const oldReviewers = await getReviewersOfAnArticle(code);
    let deletedReviewerSSNs= [];
    let insertedReviewerDetails = [];

    oldReviewers.forEach(reviewer =>{
        // Nếu không match với bất kỳ ssn nào
        if(assignmentDetails.every(detail => reviewer.ssn!=detail.reviewerSSN))
            deletedReviewerSSNs.push(reviewer.ssn);
    });

    assignmentDetails.forEach(detail=>{
         // Nếu không match với bất kỳ ssn nào
         if(oldReviewers.every(reviewer => reviewer.ssn!=detail.reviewerSSN))
            insertedReviewerDetails.push(detail);
    })

    console.log(deletedReviewerSSNs, insertedReviewerDetails);

    const assignNewReviewerProcedure = 'INSERT_PHANCONG';
    const unassignReviewerProcefure = 'DELETE_PHANCONG';
    let insertedParams = {"MABAIBAO": code, "PHANBIENSSN": "", "BIENTAPSSN": editorSSN, "HANGOI": ""};
    let deletedParams = {"MABAIBAO": code, "PHANBIENSSN": "", "BIENTAPSSN": editorSSN};
    let res = true;

    for(idx in deletedReviewerSSNs)
    {
        deletedParams["PHANBIENSSN"] = deletedReviewerSSNs[idx];      
        const isSuccess = await dbUtils.execProcedure(config, unassignReviewerProcefure, deletedParams, "")
        if(!isSuccess){
           res= isSuccess;
           return false;
        }
    }

    for(idx in insertedReviewerDetails){
        insertedParams["PHANBIENSSN"] = insertedReviewerDetails[idx].reviewerSSN;
        insertedParams["HANGOI"] = insertedReviewerDetails[idx].deadline;

        const isSucess = await dbUtils.execProcedure(config, assignNewReviewerProcedure, insertedParams, "");
        if(!isSucess){
            res= isSuccess;
            return false; 
         }
    }

    return res;
}

const getReviewContentOfAnArticle = async(code)=>{
    const sqlStatement = `Select B.MABAIBAO, B.PHANBIENSSN, NGAYPHANCONG, HANGOI, KETQUA, GHICHUBIENTAP, NOIDUNG 
                        FROM PHANCONG P LEFT JOIN BAIPHANBIEN B ON P.MABAIBAO = B.MABAIBAO AND P.PHANBIENSSN = B.PHANBIENSSN
                        WHERE B.MABAIBAO = '${code}';`;

    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0){
        let result = [];
        const rows = table.rows;
        rows.forEach(row => {
            result.push({code: row[0], reviewerSSN: row[1], assignDate: row[2], deadline: new Date(row[3]).toLocaleString(), result: row[4], noteForEditor: row[5], content: row[6]});
        });
        return result;
    }
    else
        return [];
}

const updateStateOfArticle = async(code, state, editorSSN)=>{
    const procedureName = "UPDATE_TTXL_BAIBAO";

    const params = {
        "TTXL": state,
        "MABAIBAO": code,
        "BIENTAPSSN": editorSSN
    }

    const isSuccess = await dbUtils.execProcedure(config, procedureName, params, "");
    return isSuccess;
}

const updateReviewResult = async (code, reviewerSSN, editorSSN, result) =>{
    if(result !=='ChapNhanPhanBien' && result !=='TuChoiPhanBien')
        return false;
    
    const procedureName = "UPDATE_KQPB_PC";
    const params = {
        "MABAIBAO": code,
        "KQPB" : result,
        "PHANBIENSSN": reviewerSSN,
        "BIENTAPSSN": editorSSN
    };

    const isSucess = await dbUtils.execProcedure(config, procedureName, params, "");
    return isSucess;
}

const updateArticleResult = async(code, editorSSN, result, notifyDate, note) =>{
    const procedureName = "UPDATE_KQ_BAIBAO";
    const params = {
        "MABAIBAO": code,
        "BIENTAPSSN": editorSSN,
        "KQ": result,
        "NGAYTHONGBAO": notifyDate, 
        "CHITIETKHAC": note 
    }

    return (await dbUtils.execProcedure(config, procedureName, params, ""));
}

module.exports = {
    updateProfile: updateProfile,
    getProfile: getProfile,
    articleFilterTypes: articleFilterTypes,
    filterArticlesByType: filterArticlesByType,
    acceptArticle: acceptArticle,
    getAllReviewerExceptMe: getAllReviewerExceptMe,
    updateReviewers: updateReviewers,
    getReviewersOfAnArticle: getReviewersOfAnArticle,
    getReviewContentOfAnArticle: getReviewContentOfAnArticle,
    updateStateOfArticle: updateStateOfArticle,
    updateReviewResult: updateReviewResult,
    updateArticleResult: updateArticleResult
}