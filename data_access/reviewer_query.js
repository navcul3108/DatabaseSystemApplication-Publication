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

const getAllReviewedCriteriasOfAnrticle = async (code, reviewerSSN) =>{
    const procedureName = "XEM_TIEUCHI_PHANBIEN";
    const params= {
        "MABAIBAO": code,
        "PHANBIENSSN": reviewerSSN
    };

    const table = await dbUtils.execProcedure(config, procedureName, params, "", true);
    if(table.rows.length>0){
        let criterias = [];
        table.rows.forEach(row=>{
            criterias.push({content: row[0], description: row[1], sscore: row[2]});
        })
        return criterias;
    }
    return []
}

const getAllCriterias = async()=>{
    const sqlStatement = `Select T.MATIEUCHI, NOIDUNG, MOTA, DIEM From TIEUCHIDANHGIA T JOIN MUCDANHGIA M ON T.MATIEUCHI = M.MATIEUCHI;`;

    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0)
    {
        let allCriterias = new Map();
        table.rows.forEach(row=>{
            if(!allCriterias.has(row[0]))
                allCriterias.set(row[0], {content: row[1], scores: [{description: row[2], score: row[3]}]});
            else{
                let criteria = allCriterias.get(row[0]);
                criteria.scores.push({description: row[2], score: row[3]});
                allCriterias.set(row[0], criteria);
            }
        })
        return allCriterias;
    }
    return {};
}

const getReviewOfAnArticle = async (code, reviewerSSN)=>{
    const sqlStatement = `Select B.MABAIBAO, B.PHANBIENSSN, NGAYPHANCONG, HANGOI, KETQUA, GHICHUTACGIA, GHICHUBIENTAP,NOIDUNG 
                            FROM PHANCONG P JOIN BAIPHANBIEN B ON P.MABAIBAO = B.MABAIBAO AND P.PHANBIENSSN = B.PHANBIENSSN
                            WHERE B.MABAIBAO = '${code}' AND B.PHANBIENSSN='${reviewerSSN}';`;

    const table = await dbUtils.queryDatabase(config, sqlStatement, "", true);
    if(table.rows.length>0){
        const row = table.rows[0];
        return {code: row[0], reviewerSSN: row[1], assignDate: row[2], deadline: row[3], result: row[4], noteForAuthor: row[5], noteForEditor: row[6], content: row[7]};
    }
    return null;
}

module.exports = {
    updateProfile: updateProfile,
    getProfile: getProfile,
    getAllReviewedCriteriasOfAnArticle: getAllReviewedCriteriasOfAnrticle,
    getAllCriterias: getAllCriterias,
    getReviewOfAnArticle: getReviewOfAnArticle
}
