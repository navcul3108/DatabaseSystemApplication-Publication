const sql = require("mssql/msnodesqlv8");
require('dotenv').config();
/**
 *  Connect database with @config and query @sqlStatment
 *
 * @param {mssqlConfig} config
 * @param {string} sqlStatement
 * @param {string} successMsg
 * @return {boolean} True if success otherwise false 
 */
const queryDatabase = async (config, sqlStatement, successMsg) =>{
    var conn = new sql.ConnectionPool(config, (err)=>{
        if(err != null)
            console.log("Error while setting connection to database ", err)
    });
    let error = null;

    await conn.connect().then(async ()=>{
        let request = new sql.Request(conn);
        request.query(sqlStatement)
        .then(async ()=>{
            console.log(successMsg);
        })
        .catch(err => {
            error=err;
            console.log(err);
        })
    })
    .catch(err => {
        error=err;
        console.log(err);
    })

    if(error == null)
        return true;
    else
        return false;
}

module.exports = {
    config : {
        server: 'DESKTOP-DVVFCRT\\SQLEXPRESS',
        database: "TAPCHI",
        driver: "msnodesqlv8",
        options: {
            trustedConnection: false
        }
    },
    databaseLogin : {
        "Biên tập": { user: process.env.bientaplogin, password: process.env.bientappassword },
        "Tác giả": { user: process.env.tacgialogin, password: process.env.tacgiapassword },
        "Phản biện": { user: process.env.phanbienlogin, password: process.env.phanbienpassword }
    },
    defaultLogin : {
        user:  process.env.khachlogin,
        password:  process.env.khachpassword
    },
    queryDatabase : queryDatabase
}