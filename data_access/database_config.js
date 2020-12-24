require('dotenv').config();

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
    }

}