const express = require("express");
const fs = require("fs");
const path =require("path");
var router = express.Router();

router.get("/articleFile", (req, res)=>{
    if(!req.session.user)
        res.send(null);
    const filePath = req.query.filePath;
    if(fs.existsSync(`./public/articles/${filePath}`))
        res.sendFile(path.join(global.approot+ `/public/articles/${filePath}`));
    else
        res.render("error", {message: "Không tồn tại file này"});
})

module.exports = router;