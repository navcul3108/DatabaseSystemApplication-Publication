var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require("express-session")

var oktaUtils = require("./routes/okta_utils");
var userRouter = require('./routes/users');
var queryRouter = require("./routes/query");

var app = express();

var oktaClient = oktaUtils.oktaClient;
const oidc = oktaUtils.oidc;

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
  if(req.url == '/logout')
  {
    req.session.user = null;
    req.session.groups = null;
    return next();
  }
  if (req.session.passport==undefined || req.session.passport.user==undefined) {
    return next();
  }

  if(req.session.isAdmin!=undefined)
    res.locals.isAdmin = req.session.isAdmin;
  else
    res.locals.isAdmin = false;

  if(req.session.user!=undefined)
  {
    req.user = req.session.user;
    res.locals.user = req.session.user;

    return next();
  }

  /*Get user infomation and save into session*/
  const userinfo = req.session.passport.user.userinfo;
  oktaClient.getUser(userinfo.sub)
    .then(user => {
      req.session.user = user;
      req.user = user;
      res.locals.user = user;

      const userId = user.id;
      const url =  "https://dev-6895187.okta.com/api/v1/users/"+ userId + "/groups";

      oktaClient.http.http(url, oktaUtils.oktaRequest)
        .then(res=> res.text())
        .then(text => {
          const json = JSON.parse(text);
          const groups = json.filter(group => group.profile.name != "Everyone");
          const isAdmin = json.some(group => group.profile.name=="Admin");
          req.session.groups = groups;
          req.session.isAdmin = isAdmin;
          res.locals.isAdmin = isAdmin;
          next();
        })
        .catch(err=> next(err));
    }).catch(err => {
      next(err);
    });
});
app.use(oidc.router);

app.use('/users', userRouter);
app.use("/query", queryRouter);

app.get('/', (req, res) => {
  res.render('home/index');
})

// error handler
app.use(function(err, req, res, next) {
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
