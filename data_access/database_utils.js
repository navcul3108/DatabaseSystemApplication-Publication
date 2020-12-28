const sql = require("mssql/msnodesqlv8");
require('dotenv').config();
/**
 *  Connect database with @config and query @sqlStatment
 *
 * @param {mssqlConfig} config
 * @param {string} sqlStatement
 * @param {string} successMsg
 * @return If returnTable is True, return recordset, else return true if success else false
 */
const queryDatabase = async (config, sqlStatement, successMsg, returnTable = false) => {
    sql.on("error", err => {
        console.error(err);
    })
    var conn = new sql.ConnectionPool(config, (err) => {
        if (err != null)
            console.log("Error while setting connection to database ", err)
    });
    let error = null;
    let result = null;
    try {
        await conn.connect()
            .then(async () => {
                let request = new sql.Request(conn);
                try {
                    await request.query(sqlStatement)
                        .then((res) => {
                            if (returnTable && res.recordset) {
                                result = res.recordset.toTable();
                            }
                            else
                                result = res;
                            
                            console.log(sqlStatement);
                            console.log(successMsg);
                        })
                        .catch(err => {
                            error = err;
                            console.error(err);
                        })
                }
                catch (err) {
                    console.error(err);
                    error = err;
                }
            })
            .catch(err => {
                error = err;
                console.error(err);
            })
    }
    catch (err) {
        console.error(err);
        error = err;
    }
    finally {
        conn.close();
    }

    if (returnTable) {
        return result;
    }
    else {
        if (error == null && result.rowsAffected.every(num=> num>0))
            return true;
        else
            return false;
    }
}

const execProcedure = async (config, procedureName, params, successMsg, returnTable = false) => {
    var conn = new sql.ConnectionPool(config, (err) => {
        if (err != null)
            console.log("Error while setting connection to database ", err)
    });
    let error = null;
    let result = null;
    try {
        await conn.connect()
            .then(async () => {
                let request = new sql.Request(conn);
                for (key in params) {
                    request.input(key, params[key]);
                }
                try {
                    await request.execute(procedureName)
                        .then((res) => {
                            if (returnTable && res.recordset) {
                                result = res.recordset.toTable();
                            }
                            else
                                result = res;
                            console.log(successMsg);
                        })
                        .catch(err => {
                            error = err;
                            console.error(err);
                        })
                }
                catch (err) {
                    console.error(err);
                    error = err;
                }
            })
            .catch(err => {
                error = err;
                console.error(err);
            })
    }
    catch (err) {
        console.error(err);
        error = err;
    }
    finally {
        conn.close();
    }

    if (returnTable) {
        return result;
    }
    else {
        if (error == null && result.rowsAffected.every(num=> num>0))
            return true;
        else
            return false;
    }
}

module.exports = {
    config: {
        server: 'DESKTOP-DVVFCRT\\SQLEXPRESS',
        database: "TAPCHI",
        driver: "msnodesqlv8",
        options: {
            trustedConnection: false
        }
    },
    databaseLogin: {
        "Biên tập": { user: process.env.bientaplogin, password: process.env.bientappassword },
        "Tác giả": { user: process.env.tacgialogin, password: process.env.tacgiapassword },
        "Phản biện": { user: process.env.phanbienlogin, password: process.env.phanbienpassword }
    },
    defaultLogin: {
        user: process.env.khachlogin,
        password: process.env.khachpassword
    },
    queryDatabase: queryDatabase,
    execProcedure: execProcedure
}