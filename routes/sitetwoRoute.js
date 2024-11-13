var express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const qs = require('qs');
const cheerio = require('cheerio');
var siteoneLogin = express.Router();
var siteoneInfo = express.Router();
var siteoneProducts = express.Router();
var siteoneProductSave = express.Router();
const authenticateToken = require('../middlewares/jwtMiddleware.js');
const refreshToken = require('../middlewares/sitetwoMiddleware.js');
const User = require('../models/userModel.js');
const Product = require('../models/sitetwoProductModel.js');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// Proxy kimlik bilgilerinizi içeren URL
const proxyAuth = 'vxiygX:1DbMmm@176.46.139.124:50100';
const proxyUrl = `http://${proxyAuth}`;

// HTTPS için proxy agent oluşturuluyor
const httpsAgent = new HttpsProxyAgent(proxyUrl);



siteoneLogin.post('/',authenticateToken, async function (req, res) {
 
    
    try {
      
     

    let user = await User.findOne({ _id: req.user.userId });
     
    if(user.sitetwoAcc.Email) return res.status(403).json({ errorMessage: "Hesap Değiştirebilmek için Yönetici ile görüşün !"});

    const { Email, Password } = req.body;
    
    if (!Email || !Password) return res.status(403).json({ errorMessage: "Oturum hatalı !"});
    
    

    let data = JSON.stringify({
        "username": `${Email}`,
        "password": `${Password}`
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
        maxRedirects: 10,
        data : data,
        httpsAgent: httpsAgent
      };
      console.log("burda");

      const response = await axios.request(config);

      

      if (response.data.message !== "Başarıyla giriş yaptınız") return res.status(403).json({ errorMessage: "Hatalı hesap bilgileri girdiniz!"});


   // console.log(response.data);    
        
   

     await User.updateOne({ _id: req.user.userId }, { sitetwoAcc: {Email: `${Email}`, Password: `${Password}`, Token: `${response.data.data.authorization.token}`, refreshToken: `${response.data.data.authorization.refreshToken}`}});

     res.json({errorMessage: false, status: true, message: "Hesap Kontrol Edildi ve Başarıyla Kaydedildi."})
}
catch (error) {
  console.log(error);
    res.status(403).json({ errorMessage: "Hatalı hesap bilgileri girdiniz!"});
}

});


siteoneInfo.get('/',authenticateToken, refreshToken, async function (req, res) {
  
     
    try {

    let user = await User.findOne({ _id: req.user.userId });
     
    
    if(!user.sitetwoAcc.Email) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});
    
    
      
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://www.sitetwo.com/api/v1/me/info',
        headers: { 
          'Accept-Encoding': 'gzip', 
          'user-agent': 'Dart/3.1 (dart:io)', 
          'authorization': `Bearer ${user.sitetwoAcc.Token}`
        },
        maxRedirects: 10,
        httpsAgent: httpsAgent
      };
      let config2 = {
        method: 'get',
        maxBodyLength: Infinity,
        url: 'https://www.sitetwo.com/api/v1/me/bank-account',
        headers: { 
          'Accept-Encoding': 'gzip', 
          'user-agent': 'Dart/3.1 (dart:io)', 
          'authorization': `Bearer ${user.sitetwoAcc.Token}`
        },
        maxRedirects: 10,
        httpsAgent: httpsAgent
      };

      const response = await axios.request(config);
      const response2 = await axios.request(config2);
      response.data.me.ibanData = response2.data
     res.json({errorMessage: false, status: true, message: "Hesap verileri Başarıyla getirildi.", data: response.data})
}
catch (error) {
    res.status(403).json({ errorMessage: "Oturum hatalı siteone !"});

    
}

});

siteoneProducts.get('/',authenticateToken, refreshToken, async function (req, res) {
  
     
  try {

  let user = await User.findOne({ _id: req.user.userId });
   
  
  if(!user.sitetwoAcc.Email) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});
  
  let savedProductsa = await Product.find({ user: user._id}).populate('user');
  
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: 'https://www.sitetwo.com/api/v1/merchant/products?status=onSale&orderStatus=all&direction=desc&page=1&limit=1000&query=',
    headers: { 
      'Accept-Encoding': 'gzip', 
      'authorization': `Bearer ${user.sitetwoAcc.Token}`, 
      'user-agent': 'Dart/3.1 (dart:io)'
    },
    maxRedirects: 10,
    httpsAgent: httpsAgent
  };
  
    const response = await axios.request(config);


    let products = await response.data?.products?.filter(x => x?.sellerDynamics?.sellRankNumber !== 0);

    const promiseDizisi = products.map(pro => axios.request({
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://www.sitetwo.com/api/v1/listing/${pro.listing.id}/cheapest-products-grouped-by-size`,
      headers: { 
        'Accept-Encoding': 'gzip', 
        'authorization': `Bearer ${user.sitetwoAcc.Token}`, 
        'user-agent': 'Dart/3.1 (dart:io)'
      },
      maxRedirects: 10,
    httpsAgent: httpsAgent
     
    }));

    const sonuclar = await Promise.all(promiseDizisi);

   let sonsonuclar = sonuclar.map((sonuc, index) => {
    let proso = products[index]
    let size = sonuc.data.cheapestOnSaleProductsBySize.find(x => x.size.id == proso.size.id)
      return {
          anaproduct: proso.id, // İlgili istek bilgisi
          sonuc: size // İstek sonucu
      };
  });

    let extraData = [];

    let savedProductso = savedProductsa.map(savedProducts =>  savedProducts = { minPrice: savedProducts.minPrice,checkedBot: savedProducts.botActive, checkedTers: savedProducts.reverseBot, ilanID: savedProducts.ilanId, activites: savedProducts.activites})
   
    
    res.json({errorMessage: false, status: true, message: "Hesap verileri Başarıyla getirildi.", data: response.data, extraData: sonsonuclar, savedProducts: savedProductso})
}
catch (error) {
  console.log(error);
  res.status(403).json({ errorMessage: "Oturum hatalı siteone !"});

 // console.log(error);
}

});


siteoneProductSave.post('/',authenticateToken, async function (req, res) {
  
try {
  const {minPrice, checkedBot, checkedTers, productId, productCode, ilanID, size} = req.body;
  if (!(checkedTers == true || checkedTers == false) || !(checkedBot == true || checkedBot == false) || !minPrice || !productId || !productCode || !ilanID || !size ) return res.status(403).json({ errorMessage: "Hatalı istek !"});
  let user = await User.findOne({ _id: req.user.userId });
  let product = await Product.findOne({ ilanId: ilanID });
  if(!user.sitetwoAcc.Email) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});
  let data = { minPrice,checkedBot, checkedTers, ilanID}
if(product) {
  if (product.minPrice !== minPrice || product.botActive !== checkedBot || product.reverseBot !== checkedTers) {
    let activates = [...product.activites, { Date: Date.now(), type: "productUpdate" }];
    const query = { ilanId: ilanID }; // Bu, güncellenmek istenen ürünü tanımlar
    const updateData = {
      minPrice: minPrice,
      botActive: checkedBot,
      reverseBot: checkedTers,
      activites: activates
    };
    
    let updated = await Product.findOneAndUpdate(query, updateData, { new: true });
   // console.log(updated);
  }

} else {
  
  const newProduct = new Product({
    ilanId: ilanID,
    urunId: productId,
    urunCode: productCode,
    urunSize: size,
    minPrice: minPrice,
    botActive: checkedBot,
    reverseBot: checkedTers,
    activites: [{ Date: Date.now(), type: "productCreate" }],
    user: user._id,
  });
 await newProduct.save()
}
 
res.json({errorMessage: false, status: true, message: "Ürün Başarıyla Kaydedildi.", data, })
} catch (error) {
 // console.log(error);
  res.status(403).json({ errorMessage: "Oturum hatalı siteone !"});
}

});





module.exports = {siteoneLogin, siteoneInfo, siteoneProducts, siteoneProductSave};
