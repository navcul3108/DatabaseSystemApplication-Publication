const dbUtils = require("./database_utils");
require("dotenv").config();

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

const updateProfile = async (ssn, email)=>{
    const sqlStatement =    `Update TACGIA
                                Set EMAIL = '${email}' 
                                Where SSN = '${ssn}';`;
    const successMsg = "Update TACGIA profile successfully";                        

    return await dbUtils.queryDatabase(config, sqlStatement, successMsg);
}

const getProfile = async (ssn)=>{
    const sqlStatement = `Select EMAIL From TACGIA WHERE SSN='${ssn}';`;
    
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length >0)
    {
        console.log(table);
        return {email: table.rows[0][0]}
    }    
    else
        return null;
}

const getAllAuthorExceptMe = async (ssn)=>{
    const sqlStatement = `Select SSN, HO +' '+ TEN FROM NHAKHOAHOC WHERE SSN IN (SELECT SSN FROM TACGIA WHERE SSN!='${ssn}');`;
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length > 0)
        return table.rows.map(row => {return {ssn: row[0], fullName: row[1]};});
    else
        return [];
}

const getAllAuthorsOfAnArticle = async(code) =>{
    const sqlStatement = `Select MABAIBAO, TACGIASSN, HO+' '+TEN From BAIBAOVATACGIA WHERE MABAIBAO='${code}';`;

    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0)
    {
        const result = [];
        table.rows.forEach(row => {
            result.push({ssn: row[1], fullName: row[2]});
        })
        return result;
    }
    else
        return null;
}

const getReviewsOfAnArticle = async(code) =>{
    const sqlStatement = `Select B.MABAIBAO, B.PHANBIENSSN, NGAYPHANCONG, HANGOI, KETQUA, GHICHUTACGIA, NOIDUNG 
                            FROM PHANCONG P LEFT JOIN BAIPHANBIEN B ON P.MABAIBAO = B.MABAIBAO AND P.PHANBIENSSN = B.PHANBIENSSN
                            WHERE B.MABAIBAO = '${code}';`;
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0){
        let result = [];
        const rows = table.rows;
        rows.forEach(row => {
            result.push({code: row[0], reviewerSSN: row[1], assignDate: row[2], deadline: row[3], result: row[4], noteForAuthor: row[5], content: row[6]});
        });
        return result;
    }
    else
        return [];
}

module.exports = {
    updateProfile: updateProfile,
    getProfile: getProfile,
    getAllAuthorExceptMe: getAllAuthorExceptMe,
    getAllAuthorsOfAnArticle: getAllAuthorsOfAnArticle,
    getReviewsOfAnArticle: getReviewsOfAnArticle
}