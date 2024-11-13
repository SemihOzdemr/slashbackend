const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Proxy kimlik bilgilerinizi içeren URL
const proxyAuth = 'vxiygX:1DbMmm@176.46.139.124:50100';
const proxyUrl = `http://${proxyAuth}`;

// HTTPS için proxy agent oluşturuluyor
const httpsAgent = new HttpsProxyAgent(proxyUrl);

async function refreshToken(req, res, next) {
  let user = await User.findOne({ _id: req.user.userId }); 
 try {
  if(!user.sitetwoAcc.Token) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://www.sitetwo.com/api/v1/me/info',
    headers: { 
      'Accept-Encoding': 'gzip', 
      'user-agent': 'Dart/3.1 (dart:io)', 
      'authorization': `Bearer ${user.sitetwoAcc.Token}`
    },
    maxRedirects: 0,
    httpsAgent: httpsAgent
  };


  const response = await axios.request(config);
   
 // console.log(response.status);
 // console.log("bu stat 1");
  next()

 } catch (error) {

  try {

    if(!user.sitetwoAcc.refreshToken) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});

    let data = JSON.stringify({
      "refresh_token": `${user.sitetwoAcc.refreshToken}`
    });
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://www.sitetwo.com/api/token/refresh',
      headers: { 
        'Accept-Encoding': 'gzip', 
        'user-agent': 'Dart/3.1 (dart:io)', 
        'Content-Type': 'application/json'
      },
      maxRedirects: 0,
      data : data,
      httpsAgent: httpsAgent
    };


    const response = await axios.request(config);
    await User.updateOne({ _id: req.user.userId }, { sitetwoAcc: {Email: `${user.sitetwoAcc.Email}`, Password: `${user.sitetwoAcc.Password}`, Token: `${response.data.token}`, refreshToken: `${response.data.refresh_token}`}});
   // console.log(response.status);
   // console.log("bu stat 2");
    next()

  } catch (error) {
    
    try {
      
      if(!user.sitetwoAcc.Email || !user.sitetwoAcc.Password) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});
      let data = JSON.stringify({
        "username": `${user.sitetwoAcc.Email}`,
        "password": `${user.sitetwoAcc.Password}`
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://www.sitetwo.com/api/v1/user/login',
        headers: { 
          'Accept-Encoding': 'gzip', 
          'user-agent': 'Dart/3.1 (dart:io)', 
          'Content-Type': 'application/json'
        },
        maxRedirects: 0,
        data : data,
        httpsAgent: httpsAgent
      };

      const response = await axios.request(config);
      await User.updateOne({ _id: req.user.userId }, { sitetwoAcc: {Email: `${user.sitetwoAcc.Email}`, Password: `${user.sitetwoAcc.Password}`, Token: `${response.data.data.authorization.token}`, refreshToken: `${response.data.data.authorization.refreshToken}`}});
     // console.log(response.status);
     // console.log("bu stat 3");
      next()

    
    } catch (error) {
     // console.log("en son catch çalıştı");
      res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});
    }


    
  }
  
 }
}

module.exports = refreshToken;