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

const updateProfile = async (userId, email)=>{
    const sqlStatement =    `Update TACGIA
                                Set EMAIL = '${email}' 
                                Where SSN = (Select SSN From ACCOUNT_NHAKHOAHOC WHERE ID = '${userId}')`;
    const successMsg = "Update TACGIA profile successfully";                        

    return await dbUtils.queryDatabase(config, sqlStatement, successMsg);
}

module.exports = {
    updateProfile: updateProfile
}