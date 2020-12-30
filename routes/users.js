const express = require("express");
const okta = require("@okta/okta-sdk-nodejs");
const oktaUtils = require("./okta_utils");
const userQuery = require("../data_access/user_query");
const authorQuery = require("../data_access/author_query");
const editorQuery = require("../data_access/editor_query");
const reviewerQuery = require("../data_access/reviewer_query");
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

router.get('/profile', async (req, res)=>{
  if(req.session.groups)
  {
    if( req.session.groups.length==0 || req.session.isAdmin)
    {
      res.render("shared_profile", {user: req.session.user, groups: []});
    }
    else
    {
      const profile = await userQuery.getProfileOfScientist(req.session.user.id);
      const ssn = req.session.ssn;
      var groupProfiles = new Map();
      const groups = req.session.groups;
  
      for(var i=0; i< groups.length; i++)
      {
        const group = groups[i];
        if(group.profile.name=="Tác giả")
          groupProfiles["Tác giả"] = await authorQuery.getProfile(ssn);
        else if(group.profile.name == "Biên tập")
          groupProfiles["Biên tập"] = await editorQuery.getProfile(ssn);
        else if(group.profile.name == "Phản biện")
          groupProfiles["Phản biện"] =  await reviewerQuery.getProfile(ssn);
      } 
  
      console.log(groupProfiles);
      res.render("shared_profile", {groups: groups, profile: profile, groupProfiles: groupProfiles});
    }    
  }
  else{
    res.redirect('/users/register');
  }
});

router.post('/update-profile', async (req, res)=>{
  const {body} = req;
  const firstName = body.firstName;
  const lastName = body.lastName;
  const address = body.address;
  const workingPlace = body.workingPlace;
  const job = body.job;
  const telephone = body.telephone;
  const ssn = req.session.ssn;

  if(await userQuery.updateScientistProfile(ssn, firstName, lastName, address, workingPlace, job, telephone))
    res.redirect("back");
  else
    res.render("error");
})

module.exports = router;