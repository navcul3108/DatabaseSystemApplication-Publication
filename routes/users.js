const express = require("express");
const okta = require("@okta/okta-sdk-nodejs");
const oktaUtils = require("./okta_utils");
const { route } = require("./query");
const userQuery = require("../data_access/user_query");
require("dotenv").config();

const router = express.Router();

var oktaClient = oktaUtils.oktaClient;

const fields = [
  { name: 'firstName', label: 'First Name' },
  { name: 'lastName', label: 'Last Name' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'password', label: 'Password', type: 'password' }
];

router.get('/register', (req, res)=>{
  res.render('users/register', {fields: fields});
});

router.post('/register', async (req, res)=>{
  const { body } = req;
  try {
      await oktaClient.createUser({
      profile: {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          login: body.email
      },
      credentials: {
          password: {
          value: body.password
          }
      }
      });
      let user = await oktaClient.getUser(body.email);
      userQuery.registerNewUser(user.id, body.email, body.password, body.firstName, body.lastName);
      res.redirect('/');
  } catch ( errorCauses) {
      const message = errorCauses.message;
      res.render("error", {message: message, error: errorCauses});
  }
});

router.get('/profile', (req, res)=>{
  if(req.session.groups)
  {
    res.render('users/profile', {groups: req.session.groups});
  }
  else{
    res.redirect('/users/register');
  }
});

router.get("/manage-people", (req, res)=>{
  if(req.session.groups != null)
  {
    if(req.session.isAdmin)
    {
      res.render("users/manage_people");
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
        const allUsers = await oktaUtils.getAllUsers();
        const allGroups = await oktaUtils.getAllGroups();

        res.json({users: allUsers, groups: allGroups});
      }
    else{
      res.render("unauthenticated");
    }
  }
  else
    res.redirect("/");
})

module.exports = router;