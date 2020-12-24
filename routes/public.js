const express = require("express");

const router = express.Router();

// Home page
router.get("/", (req, res) => {
  if(req.userContext)
    console.log(req.userContext);
  res.render("index");
});


module.exports = router;