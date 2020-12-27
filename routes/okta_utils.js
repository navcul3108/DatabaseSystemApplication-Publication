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

const getAllUsersAndGroups = async () => {
  let listUsers = [];
  let users = oktaClient.listUsers();
  const allGroups = await getAllGroups();

  await users.each(async (user) => {
    const url = "https://dev-6895187.okta.com/api/v1/users/" + user.id + "/groups";
    let assignableGroups = null;
    let tacgiaAssignaleGroups = allGroups.filter(group => group.profile.name != "Biên tập" && group.profile.name != "Tác giả");
    let phanbienAssignaleGroups = allGroups.filter(group => group.profile.name != "Phản biện");

    await oktaClient.http.http(url, oktaRequest)
      .then(res => res.text())
      .then(text => {
        const json = JSON.parse(text);
        const groups = json.filter(group => group.profile.name != "Everyone");
        assignableGroups = null

        if (groups.length == 0)
          assignableGroups = allGroups;
        else if (groups.length == 1) {
          if (groups[0].profile.name == "Tác giả")
            assignableGroups = tacgiaAssignaleGroups;
          else if (groups[0].profile.name == "Biên tập")
            assignableGroups = tacgiaAssignaleGroups;// the same as author
          else if (groups[0].profile.name == "Phản biện")
            assignableGroups = phanbienAssignaleGroups;
        }

        listUsers.push({ id: user.id, profile: user.profile, groups: groups, assignableGroups: assignableGroups });
      })
      .catch(err => console.log(err));
  })
    .catch(err => console.log(err));
  //listUsers.sort(compareUserByGroupName);
  const result = { allUsers: JSON.stringify(listUsers), allGroups: JSON.stringify(allGroups) };

  return result;
}

const getAllGroups = async () => {
  const url = "https://dev-6895187.okta.com/api/v1/groups";
  let groups = null;
  await oktaClient.http.http(url, oktaRequest)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text);
      const notDefaultGroups = json.filter(group => group.profile.name != "Everyone" && group.profile.name != "Admin");
      groups = notDefaultGroups.map(group => {
        return { id: group.id, profile: group.profile }
      });
    });
  groups.push({ id: '#', profile: { name: "Khách" } });
  return groups;
}

const getGroupsOfUser = async (userId) => {
  const url = "https://dev-6895187.okta.com/api/v1/users/" + userId + "/groups";
  let groups = null;
  let error = null;

  await oktaClient.http.http(url, oktaRequest)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text);
      groups = json.filter(group => group.profile.name != "Everyone");
    })
    .catch(err => {error=err;});
  if(error)
    throw error;

  return groups
}

const changeGroup = async (userId, fromGroupId, toGroupId) => {
  let error = null;
  if (fromGroupId != "#") {
    const url = `https://dev-6895187.okta.com/api/v1/groups/${fromGroupId}/users/${userId}`;

    let deleteRequest = {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }
    };

    await oktaClient.http.http(url, deleteRequest)
      .then(res => { console.log("Delete user from group successfully!") })
      .catch(err => {
        error = err;
        console.log(err);
      });
  }

  if (toGroupId != "#") {
    const url = `https://dev-6895187.okta.com/api/v1/groups/${toGroupId}/users/${userId}`;

    let putRequest = {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      }
    };

    await oktaClient.http.http(url, putRequest)
      .then(res => { console.log("Add user to group successfully!") })
      .catch(err => {
        error = err;
        console.log(err);
      });
  }
  if (error == null)
    return true;
  else
    return false;
}

const removeFromGroup = async (userId, groupId) => {
  let error = null;
  const url = `https://dev-6895187.okta.com/api/v1/groups/${groupId}/users/${userId}`;
  let deleteRequest = {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    }
  };

  await oktaClient.http.http(url, deleteRequest)
    .then(res => { console.log("Delete user from group successfully!") })
    .catch(err => {
      error = err;
      console.log(err);
    });
  if (error == null)
    return true;
  else
    return false;
}

module.exports = {
  oktaClient: oktaClient,
  oidc: oidc,
  oktaRequest: oktaRequest,
  getAllUsersAndGroups: getAllUsersAndGroups,
  getAllGroups: getAllGroups,
  changeGroup: changeGroup,
  removeFromGroup: removeFromGroup,
  getGroupsOfUser: getGroupsOfUser
}