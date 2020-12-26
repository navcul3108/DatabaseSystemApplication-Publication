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

const updateProfile = async (ssn, privateEmail, publicEmail, level, major, workingDate)=>{
    const sqlStatement =    `Update PHANBIEN
                                    Set EMAILCANHAN = '${privateEmail}',
                                        EMAILCOQUAN = '${publicEmail}',
                                        TRINHDO = '${level}',
                                        CHUYENMON = '${major}',
                                        NGAYCONGTAC = '${workingDate}'
                                    Where SSN = '${ssn}'`;
    const successMsg = "Update PHANBIEN profile successfully";
    return await dbUtils.queryDatabase(config, sqlStatement, successMsg);                       
}

const getProfile = async (ssn)=>{
    const sqlStatement = `Select EMAILCANHAN, EMAILCOQUAN, TRINHDO, CHUYENMON, NGAYCONGTAC From PHANBIEN WHERE SSN='${ssn}'`;
    
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length >0){
        const row = table.rows[0]
        const workingDate = row[4]? new Date(row[4]).toISOString() : row[4];
        console.log(workingDate);
        return {privateEmail: row[0], publicEmail: row[1], level: row[2], major: row[3], workingDate: workingDate}    
    }
    return null;   
}

module.exports = {
    updateProfile: updateProfile,
    getProfile: getProfile
}
