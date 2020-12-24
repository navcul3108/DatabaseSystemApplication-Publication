sql = require("mssql/msnodesqlv8");
require("dotenv").config();

var config = {
    server: process.env.localDatabaseServer,
    database: process.env.databaseName,
    driver: "msnodesqlv8",
    options: {
        trustedConnection: false
    },
    user: process.env.adminlogin,
    password: process.env.adminpassword
};

const getSSNStatement = (account_id)=>{
    if(typeof account_id == String)
        return `SELECT ESSN FROM ACCOUNT_NHAKHOAHOC WHERE ID = '${account_id}'`;
}

const registerNewUser = (id, email, password, firstName, lastName) =>{
    var conn = new sql.ConnectionPool(config, (err)=>{
        if(err != null)
            console.log("Error while setting connection to database ", err)
    });

    conn.connect().then(async ()=>{
        var request = new sql.Request(conn);

        ssn = Math.floor(100000000 + Math.random() * 900000000);
        await request.query("SELECT SSN FROM NHAKHOAHOC")
        .then(result => {
            let listSsn = result.recordset.toTable().rows;
            let newSsn = Math.floor(100000000 + Math.random() * 900000000).toString();
            console.log(newSsn);
            while(listSsn.some(ssn => ssn == newSsn))
            {
                newSsn = Math.floor(100000000 + Math.random() * 900000000).toString();
            }
            return `INSERT INTO NHAKHOAHOC(SSN, HO, TEN, DIENTHOAI)
                    VALUES('${newSsn}', '${firstName}', '${lastName}', '12');
                    INSERT INTO ACCOUNT
                    VALUES('${id}', '${email}', '${password}', '${newSsn}');`;
        })
        .then(async (sqlStatements) => {
            console.log(sqlStatements);
            let localRequest = new sql.Request(conn);
            await localRequest.query(sqlStatements)
            .then(result => {
                console.log("Create new user successfully!");
                conn.close();
            })
            .catch(err => console.log(err));       
        })
    })
}

module.exports = {
    getSSN: getSSNStatement, 
    registerNewUser: registerNewUser,
}