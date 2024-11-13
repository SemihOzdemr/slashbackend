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
const refreshToken = require('../middlewares/siteoneMiddleware.js');
const User = require('../models/userModel.js');
const Product = require('../models/siteoneProductModel.js');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
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

async function getInfo(cookies) {
  try {
      
  let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://siteone.com/hesabim/merchant-area/',
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
    const scriptContent = $('#siteone-register-js-js-extra').html();
    const nonceMatch = scriptContent.match(/"nonce":"([a-zA-Z0-9]+)"/);
    const nonce = nonceMatch ? nonceMatch[1] : null;

   let data = qs.stringify({
      'action': 'get_price_change_form',
      'product_id': '1',
      'nonce': `${nonce}` 
    });

    let config2 = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://siteone.com/wp-admin/admin-ajax.php',
      headers: { 
        'accept': '*/*', 
        'accept-encoding': 'gzip, deflate, br', 
        'accept-language': 'tr-TR,tr;q=0.9', 
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 
        'origin': 'https://siteone.com', 
        'referer': 'https://siteone.com/hesabim/on-sales/', 
        'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"', 
        'sec-fetch-dest': 'empty', 
        'sec-fetch-mode': 'cors', 
        'sec-fetch-site': 'same-origin', 
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36', 
        'x-requested-with': 'XMLHttpRequest',
        'Cookie': cookies.join('; ')
      },
      maxRedirects: 50,
      data : data
    };
    
    const response2 = await axios.request(config2);
    
  
 
  const userNameSpan = $('.user-name.inline-block');

  // Öğenin varlığını kontrol et
  if (userNameSpan.length) {
      const extractedData = {
          adi: $('#account_name').val(),
          soyadı: $('#account_lastname').val(),
          Email: $('#account_email').val(),
          seviye: $('p:contains("Mevcut Seviyeniz:")').find('b').text(),
          komisyon: $('p:contains("Komisyon Oranınız:")').find('b').text(),
          comiss: response2.data.tax_percent
      };
    return extractedData;
  } else {
   //   console.log("bura 1");
   return false;
   
  }
  } catch (error) {
    return false;
  }
}


async function yapTumIstekler(istekListesi, nonce, cookies) {
  try {
      // Promise'ları oluştur
      const promiseDizisi = istekListesi.map(pro => axios.request({
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://siteone.com/wp-admin/admin-ajax.php',
        headers: { 
          'accept': '*/*', 
          'accept-encoding': 'gzip, deflate, br', 
          'accept-language': 'tr-TR,tr;q=0.9', 
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 
          'origin': 'https://siteone.com', 
          'referer': 'https://siteone.com/hesabim/on-sales/', 
          'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"', 
          'sec-ch-ua-mobile': '?0', 
          'sec-ch-ua-platform': '"Windows"', 
          'sec-fetch-dest': 'empty', 
          'sec-fetch-mode': 'cors', 
          'sec-fetch-site': 'same-origin', 
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36', 
          'x-requested-with': 'XMLHttpRequest',
          'Cookie': cookies.join('; ')
        },
        maxRedirects: 50,
        data : qs.stringify({
          'action': 'get_details',
          'product_id': `${pro.id}`,
          'nonce': `${nonce}` 
        })
      }));

      // Promise.all ile tüm isteklerin tamamlanmasını bekle
      const sonuclar = await Promise.all(promiseDizisi);

      // Sonuçları işle
       return sonuclar.map((sonuc, index) => {
        return {
            anaproduct: istekListesi[index], // İlgili istek bilgisi
            sonuc: sonuc.data // İstek sonucu
        };
    });
  } catch (hata) {
      console.error('İstek sırasında hata oluştu:', hata);
  }
}


async function getProducts(cookies) {
  try {
      
  let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://siteone.com/hesabim/on-sales/',
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
    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://siteone.com/hesabim/on-sales/page/2/',
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
    const response2 = await axios.request(config2);

    const $ = cheerio.load(response.data);
    const $2 = cheerio.load(response2.data);

    const scriptContent2 = $2('#siteone-register-js-js-extra').html();
    const nonceMatch2 = scriptContent2.match(/"nonce":"([a-zA-Z0-9]+)"/);
    const nonce2 = nonceMatch2 ? nonceMatch2[1] : null;

    const scriptContent = $('#siteone-register-js-js-extra').html();
    const nonceMatch = scriptContent.match(/"nonce":"([a-zA-Z0-9]+)"/);
    const nonce = nonceMatch ? nonceMatch[1] : null;

    const products = $('.woocommerce-cart-form__cart-item').map((i, el) => {
      return {
          adi: $(el).find('.product-title a').text().trim(),
          beden: $(el).find('.product-title a').text().split(' – ')[1],
          durumu: $(el).find('.lowest-ask').last().text().replace('Durum: ', '').trim(),
          fiyat: $(el).find('.product-price .woocommerce-Price-amount.amount').first().text().trim(),
          id: $(el).find('.product-action .remove').data('id'),
          resim_url: $(el).find('.product-thumbnail img').attr('src')
      };
  }).get().filter(x => x.durumu == "Satışta" || x.durumu == "Satış Sırasında");


  const products2 = $2('.woocommerce-cart-form__cart-item').map((i, el) => {
    return {
        adi: $2(el).find('.product-title a').text().trim(),
        beden: $2(el).find('.product-title a').text().split(' – ')[1],
        durumu: $2(el).find('.lowest-ask').last().text().replace('Durum: ', '').trim(),
        fiyat: $2(el).find('.product-price .woocommerce-Price-amount.amount').first().text().trim(),
        id: $2(el).find('.product-action .remove').data('id'),
        resim_url: $2(el).find('.product-thumbnail img').attr('src')
    };
}).get().filter(x => x.durumu == "Satışta" || x.durumu == "Satış Sırasında");


  let sonproducts = []

  let sonuclar = await yapTumIstekler(products, nonce, cookies);
  let sonuclar2 = await yapTumIstekler(products2, nonce, cookies);

  for (const pro of sonuclar) {
    const che = cheerio.load(pro.sonuc.html);
        //console.log(response2.data.);
        const productInfo = {
          adı: che('th').text().trim(),
          beden: pro.anaproduct.beden,
          fiyat: pro.anaproduct.fiyat,
          durumu: pro.anaproduct.durumu,
          id:pro.anaproduct.id,
          kalan_süre: che('td:contains("Kalan Süre:")').next().text(),
          net_kazancınız: che('td:contains("Net Kazancınız:")').next().text(),
          en_düşük_fiyat: che('td:contains("En Düşük Fiyat:")').next().text(),
          sıra: che('td:contains("Sıra:")').next().text(),
          sıradaki_ürünlerin_fiyatları: che('td:contains("Sıradaki Ürünlerin Fiyatları:")').next().find('div').map((i, el) => che(el).text().trim()).get(),
          resim_url: pro.anaproduct.resim_url
      };
      
      sonproducts.push(productInfo);
  }

  for (const pro of sonuclar2) {
    const che = cheerio.load(pro.sonuc.html);
        //console.log(response2.data.);
        const productInfo = {
          adı: che('th').text().trim(),
          beden: pro.anaproduct.beden,
          fiyat: pro.anaproduct.fiyat,
          durumu: pro.anaproduct.durumu,
          id:pro.anaproduct.id,
          kalan_süre: che('td:contains("Kalan Süre:")').next().text(),
          net_kazancınız: che('td:contains("Net Kazancınız:")').next().text(),
          en_düşük_fiyat: che('td:contains("En Düşük Fiyat:")').next().text(),
          sıra: che('td:contains("Sıra:")').next().text(),
          sıradaki_ürünlerin_fiyatları: che('td:contains("Sıradaki Ürünlerin Fiyatları:")').next().find('div').map((i, el) => che(el).text().trim()).get(),
          resim_url: pro.anaproduct.resim_url
      };
      
      sonproducts.push(productInfo);
  }



  return sonproducts;

 

  } catch (error) {
      console.log(error);
    return false;
  }
}


siteoneLogin.post('/',authenticateToken, async function (req, res) {
 
    
    try {
        let cookies = [];

    let user = await User.findOne({ _id: req.user.userId });
     console.log(user);
    if(user.siteoneAcc?.Email) return res.status(403).json({ errorMessage: "Hesap Değiştirebilmek için Yönetici ile görüşün !"});

    const { Email, Password } = req.body;
    
    if (!Email || !Password) return res.status(403).json({ errorMessage: "Oturum hatalı !"});
    
    let nonce = await getLoginNonce()
    
    if (!nonce) return res.status(403).json({ errorMessage: "Bir sorun oluştu !"});

    let data = qs.stringify({
        'username': `${Email}`,
        'password': `${Password}`,
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
        httpsAgent: httpsAgent,
        data : data
      };

      const response = await axios.request(config);

      
      cookies = response.headers['set-cookie'];
      if (cookies?.length > 0) {
        await User.updateOne({ _id: req.user.userId }, { siteoneAcc: {Email: `${Email}`, Password: `${Password}`, Cookies: cookies}});
        res.json({errorMessage: false, status: true, message: "Hesap Kontrol Edildi ve Başarıyla Kaydedildi."});
      } else {
        res.status(403).json({ errorMessage: "Hatalı hesap bilgileri girdiniz!"});
      }

}
catch (error) {
 
    res.status(403).json({ errorMessage: "Hatalı hesap bilgileri girdiniz!"});
}

});


siteoneInfo.get('/',authenticateToken, refreshToken, async function (req, res) {
  
  try {

  let user = await User.findOne({ _id: req.user.userId });
   
  
  if(!user.siteoneAcc.Email) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı1 !"});
  
  let infoData = await getInfo(user.siteoneAcc.Cookies)
  if(!infoData) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı2 !"});
  
   res.json({errorMessage: false, status: true, message: "Hesap verileri Başarıyla getirildi.", data: infoData})
}
catch (error) {
  res.status(403).json({ errorMessage: "Oturum hatalı siteone !"});

  
}

});


siteoneProducts.get('/',authenticateToken, refreshToken, async function (req, res) {
  
     
  try {

  let user = await User.findOne({ _id: req.user.userId });
   
  
  if(!user.siteoneAcc.Email) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı1 !"});
  
  let savedProductsa = await Product.find({ user: user._id}).populate('user');
  
  let products = await getProducts(user.siteoneAcc.Cookies)
  
  if(!products) return res.status(403).json({ errorMessage: "Bir Hata Oluştu!"});


    let savedProductso = savedProductsa.map(savedProducts =>  savedProducts = { minPrice: savedProducts.minPrice,checkedBot: savedProducts.botActive, checkedTers: savedProducts.reverseBot, ilanID: savedProducts.ilanId})
   
    
    res.json({errorMessage: false, status: true, message: "Hesap verileri Başarıyla getirildi.", data: products, savedProducts: savedProductso})
}
catch (error) {
  
  res.status(403).json({ errorMessage: "Oturum hatalı siteone !"});

 // console.log(error);
}

});


siteoneProductSave.post('/',authenticateToken, async function (req, res) {
  
  try {
    const {minPrice, checkedBot, checkedTers, ilanID} = req.body;
    if (!(checkedTers == true || checkedTers == false) || !(checkedBot == true || checkedBot == false) || !minPrice || !ilanID ) return res.status(403).json({ errorMessage: "Hatalı istek !"});
    let user = await User.findOne({ _id: req.user.userId });
    let product = await Product.findOne({ ilanId: ilanID });
    if(!user.siteoneAcc.Email) return res.status(403).json({ errorMessage: "Hesap Bilgilerin Girilmemiş veya hatalı !"});
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