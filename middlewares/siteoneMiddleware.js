const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const mongoose = require('mongoose');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const qs = require('qs');
const cheerio = require('cheerio');
// Proxy kimlik bilgilerinizi içeren URL
const proxyAuth = 'vxiygX:1DbMmm@176.46.139.124:50100';
const proxyUrl = `http://${proxyAuth}`;

// HTTPS için proxy agent oluşturuluyor
const httpsAgent = new HttpsProxyAgent(proxyUrl);

async function getLoginNonce() {
  try {
      
  let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://siteone.com/hesabim/',
      headers: { 
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
        'accept-encoding': 'gzip, deflate, br', 
        'accept-language': 'tr-TR,tr;q=0.9', 
        'cache-control': 'max-age=0', 
        'content-type': 'application/x-www-form-urlencoded', 
        'origin': 'https://siteone.com', 
        'referer': 'https://siteone.com', 
        'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"', 
        'sec-fetch-dest': 'document', 
        'sec-fetch-mode': 'navigate', 
        'sec-fetch-site': 'same-origin', 
        'sec-fetch-user': '?1', 
        'upgrade-insecure-requests': '1', 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      },
      maxRedirects: 50,
      httpsAgent: httpsAgent
    };
    const response = await axios.request(config);
    const $ = cheerio.load(response.data);
    const value = $('#woocommerce-login-nonce').val();
    return value;
  } catch (error) {
    return false;
  }
}


async function checkLogin(cookies) {
  try {
      
  let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://siteone.com/hesabim/',
      headers: { 
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7', 
        'accept-encoding': 'gzip, deflate, br', 
        'accept-language': 'tr-TR,tr;q=0.9', 
        'cache-control': 'max-age=0', 
        'content-type': 'application/x-www-form-urlencoded', 
        'origin': 'https://siteone.com', 
        'referer': 'https://siteone.com', 
        'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"', 
        'sec-fetch-dest': 'document', 
        'sec-fetch-mode': 'navigate', 
        'sec-fetch-site': 'same-origin', 
        'sec-fetch-user': '?1', 
        'upgrade-insecure-requests': '1', 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Cookie': cookies.join('; ')
      },
      maxRedirects: 50,
      httpsAgent: httpsAgent
    };
    const response = await axios.request(config);
    const $ = cheerio.load(response.data);

  // Öğeyi seç
  const userNameSpan = $('.user-name.inline-block');

  // Öğenin varlığını kontrol et
  if (userNameSpan.length) {
    
    const userName = userNameSpan.text();
    const userId = userNameSpan.find('.user-id').text();
    return true;
  } else {
      console.log("bura 1");
   return false;
   
  }
  } catch (error) {
      console.log(error);
    return false;
  }
}


async function refreshToken(req, res, next) {
  let user = await User.findOne({ _id: req.user.userId }); 
 try {
  let cookies = [];   
  if(!user.siteoneAcc.Cookies) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı 1!"});
  if(user.siteoneAcc.Cookies.length == 0) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı 2!"});
  let Checko = await checkLogin(user.siteoneAcc.Cookies);
  if (Checko) return next();

  let nonce = await getLoginNonce();

  if (!nonce) return res.status(403).json({ errorMessage: "Bir hata oluştu nonce !"});

  let data = qs.stringify({
    'username': `${user.siteoneAcc.Email}`,
    'password': `${user.siteoneAcc.Password}`,
    'woocommerce-login-nonce': nonce,
    '_wp_http_referer': '/hesabim/',
    'login': 'Giriş Yap' 
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    validateStatus: function (status) {
        return status === 302; // Yalnızca 302 durum kodu için true döndür
      },
    "credentials": "include",
    "mode": "cors",
    url: 'https://siteone.com/hesabim',
    headers: { 
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 
      'accept-encoding': 'gzip, deflate, br', 
      'accept-language': 'tr-TR,tr;q=0.9', 
      'connection': 'keep-alive',
      'cache-control': 'no-cache', 
      'content-type': 'application/x-www-form-urlencoded', 
      'origin': 'https://siteone.com', 
      'referer': 'https://siteone.com/hesabim/', 
      'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"', 
      'sec-ch-ua-mobile': '?0', 
      'sec-ch-ua-platform': '"Windows"', 
      'sec-fetch-dest': 'document', 
      'sec-fetch-mode': 'navigate', 
      'sec-fetch-site': 'same-origin', 
      'sec-fetch-user': '?1', 
      'TE': 'trailers',
      'Sec-GPC': '1',
      'DNT': '1',
      'upgrade-insecure-requests': '1', 
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36', 
    },
    maxRedirects: 0,
    data : data,
    httpsAgent: httpsAgent
  };

  const response = await axios.request(config);

  cookies = response.headers['set-cookie'];
  if (cookies?.length > 0) {
    await User.updateOne({ _id: req.user.userId }, { siteoneAcc: {Email: `${user.siteoneAcc.Email}`, Password: `${user.siteoneAcc.Password}`, Cookies: cookies}});
    return next();
  } else {
    return res.status(403).json({ errorMessage: "Bir hata oluştu nonce !"});
  }
   

  

 } catch (error) {
      console.log(error);
      res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı 33!"});
    }


    
  }
  
 


module.exports = refreshToken;