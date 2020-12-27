var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require("express-session")
var userQuery = require("./data_access/user_query");

var oktaUtils = require("./routes/okta_utils");
var userRouter = require('./routes/users');
var queryRouter = require("./routes/query");

var adminRouter = require("./routes/admin");
var authorRouter = require("./routes/author");
var editorRouter = require("./routes/editor");
var reviewerRouter = require("./routes/reviewer");

var publicRouter = require("./routes/public");

var app = express();

var oktaClient = oktaUtils.oktaClient;
const oidc = oktaUtils.oidc;

global.approot = path.resolve(__dirname);

app.get('/protected', oidc.ensureAuthenticated(), (req, res) => {
  res.send(JSON.stringify(req.userContext.userinfo));
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
  secret: 'rVtPiVabab',
  resave: true,
  saveUninitialized: false
}));
app.use((req, res, next) => {
  if (req.url == '/logout') {
    req.session.user = null;
    req.session.groups = null;
    req.session.ssn = null;
    return next();
  }
  if (req.session.passport == undefined || req.session.passport.user == undefined) {
    return next();
  }

  if (req.session.isAdmin != undefined){
    res.locals.isAdmin = req.session.isAdmin;
    res.locals.isAuthor = req.session.isAuthor;
    res.locals.isReviewer = req.session.isReviewer;
    res.locals.isEditor = req.session.isEditor;
  }    
  else{
    res.locals.isAdmin = false;
    res.locals.isAdmin = false;
    res.locals.isAuthor = false;
    res.locals.isReviewer = false;
  }

  if (req.session.user != undefined) {
    //req.user = req.session.user;
    res.locals.user = req.session.user;
    
    return next();
  }

  /*Get user infomation and save into session*/
  const userinfo = req.session.passport.user.userinfo;
  oktaClient.getUser(userinfo.sub)
    .then(async (user) => {
      req.session.user = user;
      //req.user = user;
      res.locals.user = user;

      const userId = user.id;
      // const url = "https://dev-6895187.okta.com/api/v1/users/" + userId + "/groups";

      const groups = await oktaUtils.getGroupsOfUser(userId);
      let isAdmin = false, isAuthor = false, isEditor = false, isReviewer = false;
      groups.forEach(group => {
          switch(group.profile.name){
            case "Tác giả": isAuthor=true;break;
            case "Phản biện": isReviewer=true;break;
            case "Biên tập": isEditor=true;break;
            case "Admin": isAdmin=true;break;
          }
      });

      req.session.groups = groups;
      res.locals.groups = groups;

      req.session.isAdmin = isAdmin;
      res.locals.isAdmin = isAdmin;

      req.session.isAuthor = isAuthor;
      res.locals.isAuthor = isAuthor;

      req.session.isEditor = isEditor;
      res.locals.isEditor = isEditor;

      req.session.isReviewer = isReviewer;
      res.locals.isReviewer = isReviewer;

      req.session.ssn = await userQuery.getSSN(userId);
      return next();

      // oktaClient.http.http(url, oktaUtils.oktaRequest)
      //   .then(res => res.text())
      //   .then(async (text) => {
      //     const json = JSON.parse(text);
      //     const groups = json.filter(group => group.profile.name != "Everyone");
      //     let isAdmin = false, isAuthor = false, isEditor = false, isReviewer = false;
      //     groups.forEach(group => {
      //         switch(group.profile.name){
      //           case "Tác giả": isAuthor=true;break;
      //           case "Phản biện": isReviewer=true;break;
      //           case "Biên tập": isEditor=true;break;
      //           case "Admin": isAdmin=true;break;
      //         }
      //     });

      //     req.session.groups = groups;
      //     req.locals.groups = groups

      //     req.session.isAdmin = isAdmin;
      //     res.locals.isAdmin = isAdmin;

      //     req.session.isAuthor = isAuthor;
      //     res.locals.isAuthor = isAuthor;

      //     req.session.isEditor = isEditor;
      //     res.locals.isEditor = isEditor;

      //     req.session.isReviewer = isReviewer;
      //     res.locals.isReviewer = isReviewer;

      //     req.session.ssn = await userQuery.getSSN(userId);
      //     return next();
      //   })
      //   .catch(err => next(err));
    }).catch(err => next(err));
});
app.use(oidc.router);

app.use('/users', userRouter);
app.use("/query", queryRouter);
app.use("/admin", adminRouter);
app.use("/author", authorRouter);
app.use("/editor", editorRouter);
app.use("/reviewer", reviewerRouter);
app.use("/public", publicRouter);

app.get('/', (req, res) => {
  res.render('home/index');
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// test login function
app.get('/test', (req, res) => {
  res.json({ profile: req.userContext ? req.userContext.userinfo.profile : null });
});

module.exports = app;
