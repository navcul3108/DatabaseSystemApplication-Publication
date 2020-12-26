const sql = require("mssql/msnodesqlv8");
const dbUtils = require("./database_utils");
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

const getSSN = async (userId)=>{
    const sqlStatement = `Select SSN From ACCOUNT_NHAKHOAHOC WHERE ID = '${userId}';`;
    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    return table.rows[0][0].toString();
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

const changeGroup = async (userId, fromGroupName, toGroupName) => {
    let tableName = null;
    let error = null;
    switch(toGroupName){
        case "Biên tập": 
            tableName = "BIENTAP";
            break;
        case "Tác giả" : 
            tableName = "TACGIA";
            break;
        case "Phản biện" : 
            tableName = "PHANBIEN";
            break;
        default : throw Error("Cannot change this account to group "+ toGroupName)
    }

    const sqlStatement = `Insert Into ${tableName}(SSN)
                            Values((Select SSN From ACCOUNT_NHAKHOAHOC Where ID = '${userId}'));`;
    console.log(sqlStatement);
    const successMsg = "Change group in database successfully!";

    return await dbUtils.queryDatabase(config, sqlStatement, successMsg);
}

const getProfileOfScientist = async(userId) =>{
    const sqlStatement = `Select HO, TEN, DIACHI, COQUANCONGTAC, NGHE, DIENTHOAI From ACCOUNT_NHAKHOAHOC
                           Where ID = '${userId}'`;
    const successMsg = "Get infromation of user whose id is " + userId;

    const table = (await dbUtils.queryDatabase(config, sqlStatement, successMsg, true));
    if(table.rows.length >0)
    {
        const row = table.rows[0];
        return {firstName: row[0], lastName: row[1], address: row[2], workingPlace: row[3],job: row[4], telephone: row[5]};
    }
    else
        return {firstName: '', lastName: '', address: '', workingPlace: '',job: '', telephone: ''}
} 

const updateScientistProfile = async(ssn, firstName, lastName, address, workingPlace, job, telephone) =>{
    const sqlStatement = `Update NHAKHOAHOC
                         SET HO='${firstName}', TEN='${lastName}', DIACHI='${address}',
                            COQUANCONGTAC='${workingPlace}', NGHE='${job}', DIENTHOAI='${telephone}'
                         WHERE SSN='${ssn}'`;
    console.log(sqlStatement);
    const successMsg = "Update profile of scientist successfully!";
    return await dbUtils.queryDatabase(config, sqlStatement, successMsg); 
}

module.exports = {
    getSSN: getSSN, 
    registerNewUser: registerNewUser,
    changeGroup: changeGroup,
    getProfileOfScientist: getProfileOfScientist,
    updateScientistProfile: updateScientistProfile
}