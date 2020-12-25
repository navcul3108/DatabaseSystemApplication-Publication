const express = require("express");
const okta = require("@okta/okta-sdk-nodejs");
const oktaUtils = require("./okta_utils");
const userQuery = require("../data_access/user_query");
require("dotenv").config();

var router = express.Router();

router.get("/manage-people", (req, res)=>{
    if(req.session.groups != null)
    {
      if(req.session.isAdmin)
      {
        res.render("admin/manage_people");
        return
      }
    }
    res.render("unauthenticated");  
  })

// Page that admin assign role for a user
router.get("/all-user", async (req, res)=>{
if(req.session.groups != null)
{
    if(req.session.isAdmin)
    {
        const result = await oktaUtils.getAllUsersAndGroups();
        const allUsers = result.allUsers;
        const allGroups = result.allGroups;
        
        res.json({users: allUsers, groups: allGroups});
    }
    else{
    res.render("unauthenticated");
    }
}
else
    res.redirect("/");
})

router.post("/change-group", async (req, res)=>{
    var {body} = req;
    const userId = body.userId;
    const fromGroupId = body.fromGroupId;
    const toGroupId = body.toGroupId;
    console.log(userId, fromGroupId, toGroupId);

    if(await oktaUtils.changeGroup(userId, fromGroupId, toGroupId))
    {
        const allGroups = await oktaUtils.getAllGroups();
        const fromGroup = allGroups.filter(group => group.id == fromGroupId)
        let fromGroupName = "Khách";
        if(fromGroup.length > 0)
            fromGroupName = fromGroup[0].groupName;
        
        const toGroup = allGroups.filter(group => group.id == toGroupId)
        let toGroupName = "Khách";
        if(fromGroup.length > 0)
            toGroupName = toGroup[0].groupName;
    
        if(await userQuery.changeGroup(userId, fromGroupName, toGroupName))
            res.status(200).json("Ok");
        else
        {
            oktaUtils.removeFromGroup(userId, toGroupId);
            res.status(500).json("Can not change group for this user");
        }            
    }        
    else
        res.status(500).json("Can not change group for this user");
})

module.exports = router;