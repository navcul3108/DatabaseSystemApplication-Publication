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

const getAllAuthorExceptMySelf = async (ssn)=>{
    const sqlStatement = `Select SSN, HO +' '+ TEN FROM NHAKHOAHOC WHERE SSN IN (SELECT SSN FROM TACGIA WHERE SSN!='${ssn}');`;
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length > 0)
        return table.rows.map(row => {return {ssn: row[0], fullName: row[1]};});
    else
        return [];
}

const getAllAuthorsOfAArticle = async(code) =>{
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

module.exports = {
    updateProfile: updateProfile,
    getProfile: getProfile,
    getAllAuthorExceptMySelf: getAllAuthorExceptMySelf,
    getAllAuthorsOfAArticle: getAllAuthorsOfAArticle
}