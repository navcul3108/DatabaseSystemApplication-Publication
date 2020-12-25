const sql = require("mssql/msnodesqlv8");
const express = require("express");
var router = express.Router();

const dbConfig = require("../data_access/database_utils");
var dataAccess = require("../data_access/user_query");

let config = dbConfig.config;
var curRole = null;

/*Detemine client role before query */
router.get('/', (req, res)=>{
    if(req.user == null || req.session.groups == null)
        res.redirect('/users/register');
    else{
        if(curRole==null || curRole != req.session.groups[0].profile.name)
        {
            var login = dbConfig.databaseLogin[req.session.groups[0].profile.name];
            curRole = req.session.groups[0].profile.name;
            if(login == null){
                login = dbConfig.defaultLogin;
            }
            config.user = login.user;
            config.password = login.password;
        }
        console.log("Login as", config.user)
        res.render('query/query');
    }
})

router.post('/execute', (req, res)=>{
    const sqlStatement = req.body.statement;
    console.log("Sql Statement: ", sqlStatement);
    
    var conn = new sql.ConnectionPool(config, (err)=>{
        if(err != null)
            console.log("Error while setting connection to database ", err)
    });

    conn.connect().then(function () {
        var request = new sql.Request(conn);

        request.query(sqlStatement).then(function (result) {
            conn.close();
            //const tblJson = JSON.stringify(table)
            if(result.recordset){
                res.status(200).json({message: "success", table: result.recordset.toTable()});
            }                
            else
                res.status(200).json({message: "success", rowsAffected: result.rowsAffected});
        }).catch(function (err) {
            conn.close();
            res.json({message: "err", errorMessage: err.message});
        });
    }).catch(function (err) {
        conn.close();
        res.json({message: "err", error: err});
    });
});

module.exports = router;