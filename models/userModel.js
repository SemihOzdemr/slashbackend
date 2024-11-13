
const mongoose = require('mongoose'); 

const userModel = mongoose.Schema({
    username: String,
    password: String,
    sitetwoAcc: {Email: String, Password: String, Token: String, refreshToken: String},
    siteoneAcc: {Email: String, Password: String, Cookies: Array},

  })

module.exports = mongoose.model("User", userModel)