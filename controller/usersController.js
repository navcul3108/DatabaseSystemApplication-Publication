const okta = require("@okta/okta-sdk-nodejs");
const path = require("path");
const DIR = path.join(__dirname, 'views');

var oktaClient = new okta.Client({
    orgUrl: 'https://dev-6895187.okta.com',
    token: '00_Can0REWc4L8PgqDMcWv_Btm7j6cww1MEzrL-WSp'
  });
  
const fields = [
{ name: 'firstName', label: 'First Name' },
{ name: 'lastName', label: 'Last Name' },
{ name: 'email', label: 'Email', type: 'email' },
{ name: 'password', label: 'Password', type: 'password' }
];

module.exports = {
    GETregister : (req, res)=>{
        res.render(path.join(DIR, 'register'), {fields: fields});
    },
    POSTregister : async (req, res)=>{
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
            res.redirect('/');
        } catch ( errorCauses) {
            const message = errorCauses.message;
            res.render("error", {message: message, error: errorCauses});
        }
    }
}