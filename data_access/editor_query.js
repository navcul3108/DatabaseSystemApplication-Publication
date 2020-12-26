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

module.exports = {
    updateProfile: updateProfile,
    getProfile: getProfile
}