var okta = require("@okta/okta-sdk-nodejs");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
require("dotenv").config();

var oktaClient = new okta.Client({
  orgUrl: process.env.orgUrl,
  token: process.env.token
});

const oidc = new ExpressOIDC({
  appBaseUrl: process.env.appBaseUrl,
  issuer: process.env.issuer,
  client_id: process.env.client_id,
  client_secret: process.env.client_secret,
  loginRedirectUri: process.env.loginRedirectUri,
  logoutRedirectUri: process.env.logoutRedirectUri,
  scope: "openid profile groups",
  routes: {
    loginCallback: {
      path: "/callback",
      defaultRedirect: "/"
    },
    logoutCallback: {
      path: '/'
    }
  }
});

const oktaRequest = {
  method: "GET",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  }
};

const getAllUsers = async () => {
  let listUsers = [];
  let users = oktaClient.listUsers();

  await users.each(async (user) => {
    const url = "https://dev-6895187.okta.com/api/v1/users/" + user.id + "/groups";

    await oktaClient.http.http(url, oktaRequest)
      .then(res => res.text())
      .then(text => {
        const json = JSON.parse(text);
        const groups = json.filter(group => group.profile.name != "Everyone");
        listUsers.push({ id: user.id, profile: user.profile, groups: groups });
      })
      .catch(err => console.log(err));
  })
  .catch(err => console.log(err));

  return JSON.stringify(listUsers);
}

const getAllGroups = async () => {
  const url = "https://dev-6895187.okta.com/api/v1/groups";
  let groups = null;
  await oktaClient.http.http(url, oktaRequest)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text);
      const notDefaultGroups = json.filter(group => group.profile.name != "Everyone" && group.profile.name!="Admin");
      groups = notDefaultGroups.map(group => {
        return { id: group.id, groupName: group.profile.name }
      });
    });
  groups.push({id: '', groupName: "Khách"});
  return JSON.stringify(groups);
}

module.exports = {
  oktaClient: oktaClient,
  oidc: oidc,
  oktaRequest: oktaRequest,
  getAllUsers: getAllUsers,
  getAllGroups: getAllGroups
}