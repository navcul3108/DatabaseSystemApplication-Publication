const dbUtils = require("./database_utils");
require("dotenv").config();

var config = {
    server: process.env.localDatabaseServer,
    database: process.env.databaseName,
    driver: "msnodesqlv8",
    options: {
        trustedConnection: false
    },
    user: process.env.phanbienlogin,
    password: process.env.phanbienpassword
};

const updateProfile = async (userId, privateEmail, publicEmail, level, major, workingDate)=>{
    const sqlStatement =    `Update PHANBIEN
                                    Set EMAILCANHAN = '${privateEmail}',
                                        EMAILCOQUAN = '${publicEmail}',
                                        TRINHDO = '${level}',
                                        CHUYENMON = '${major}',
                                        NGAYCONGTAC = '${workingDate}'
                                    Where SSN = (Select SSN From ACCOUNT_NHAKHOAHOC Where ID = '${userId}')`;
    const successMsg = "Update PHANBIEN profile successfully";
    return await dbUtils.queryDatabase(config, sqlStatement, successMsg);                       
}

module.exports = {
    updateProfile: updateProfile
}