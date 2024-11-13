const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../models/sitetwoProductModel.js');
const User = require('../models/userModel');
const cheerio = require('cheerio');
const qs = require('qs');
const { HttpsProxyAgent } = require('https-proxy-agent');
let intervalId;
var baslangicSaati = 2; // Sabah 2:00 başlangıç
var bitisSaati = 8; // Akşam 9:00 bitiş
// Proxy kimlik bilgilerinizi içeren URL
const proxyAuth = 'vxiygX:1DbMmm@176.46.139.124:50100';
const proxyUrl = `http://${proxyAuth}`;

// HTTPS için proxy agent oluşturuluyor
const httpsAgent = new HttpsProxyAgent(proxyUrl);

async function refreshToken(id) {
    let user = await User.findOne({ _id: id }); 
   try {
    if(!user.sitetwoAcc.Token) return false;
  
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
     
    console.log(response.status);
   // console.log("bu stat 1");
    return true;
  
   } catch (error) {
  
    try {
  
      if(!user.sitetwoAcc.refreshToken) return false;
  
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
      await User.updateOne({ _id: id }, { sitetwoAcc: {Email: `${user.sitetwoAcc.Email}`, Password: `${user.sitetwoAcc.Password}`, Token: `${response.data.token}`, refreshToken: `${response.data.refresh_token}`}});
      console.log(response.status);
      //console.log("bu stat 2");
      return true;
  
    } catch (error) {
      
      try {
        
        if(!user.sitetwoAcc.Email || !user.sitetwoAcc.Password) return false;
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
        await User.updateOne({ _id: id }, { sitetwoAcc: {Email: `${user.sitetwoAcc.Email}`, Password: `${user.sitetwoAcc.Password}`, Token: `${response.data.data.authorization.token}`, refreshToken: `${response.data.data.authorization.refreshToken}`}});
        console.log(response.status);
       // console.log("bu stat 3");
        return true;
  
      
      } catch (error) {
        return false;
      }
  
  
      
    }
    
   }
  }


  async function makeRequest(productCode, sizeId, token, cookie) {
  
    try {
      
     
      let data = qs.stringify({
        'csrf_token': `${token}`,
        'productCode': `${productCode}`,
        'size_id': `${sizeId} `
      });
  
      let config2 = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://old.sitetwo.com/get_size_list_modal',
        headers: { 
          'accept': '*/*', 
          'accept-encoding': 'gzip, deflate, br', 
          'accept-language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6,zh;q=0.5', 
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 
          'origin': 'https://old.sitetwo.com', 
          'referer': 'https://old.sitetwo.com/air-jordan-1-high-retro-og-pollen-555088-701', 
          'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"', 
          'sec-ch-ua-mobile': '?0', 
          'sec-ch-ua-platform': '"Windows"', 
          'sec-fetch-dest': 'empty', 
          'sec-fetch-mode': 'cors', 
          'sec-fetch-site': 'same-origin', 
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36', 
          'x-requested-with': 'XMLHttpRequest', 
          'Cookie': `${cookie}`
        },
        maxRedirects: 0,
        data : data,
        httpsAgent: httpsAgent
      };
  
      const response2 = await axios.request(config2);
      
  
  
      const $ = cheerio.load(response2.data);
  
      const product = {
       name: $('div > p').first().text().trim(),
       description: $('div > p').eq(1).text().trim(),
       availability: $('div:nth-of-type(2) > p').text().trim(),
       sizes: []
     };
     
     $('#customers tr:not(:first-child)').each((index, element) => {
       const size = $(element).find('td').eq(0).text().trim();
       const prices = $(element).find('td').eq(1).text().trim().replace('₺', '').replaceAll('.', '');
       let pricev3 = parseFloat(prices)
       let price = Math.floor(pricev3); 
       const condition = $(element).find('td').eq(2).text().trim();
       const buyLink = $(element).find('td').eq(3).find('a').attr('href') || null;
       const queryParams = buyLink?.split('?')[1];
       const id = queryParams?.split('=')[1];
  
       product.sizes.push({
         size,
         price,
         condition,
         buyLink,
         id
       });
     });
     
     // JavaScript objesini JSON string'ine çeviriyoruz.
     const json = JSON.stringify(product, null, 2);
     
     //console.log(json);
     return JSON.parse(json);
  
    }
    catch (error) {
       // console.log(error);
      return false;
      
    }
  }

  function enYakinSayiyiBul(dizi, hedef) {
    return dizi.reduce((onceki, mevcut) => {
      return Math.abs(mevcut - hedef) < Math.abs(onceki - hedef) ? mevcut : onceki;
    });
  }



async function myScheduledTask() {

    const rastgeleSüre = Math.random() * (900000 - 300000) + 300000;
    console.log("sitetwo süre: "+ rastgeleSüre);
    setTimeout(async () => {
      var suankiSaat = new Date().getHours();
    let savedProducts = await Product.find().populate('user');
   for (const product of savedProducts) {

   /* if (suankiSaat >= baslangicSaati && suankiSaat < bitisSaati) {
      console.log("saat duraklaması");
      continue;
    }*/

    if (!product.botActive) continue;
     try {
        let checkedtoken = await refreshToken(product.user._id)
        if (!checkedtoken) continue;
        let user = await User.findOne({ _id: product.user._id });
        
        
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://www.sitetwo.com/api/v1/merchant/product/${product.ilanId}`,
            headers: { 
              'authorization': `Bearer ${user.sitetwoAcc.Token}`, 
              'user-agent': 'Dart/3.1 (dart:io)'
            },
            maxRedirects: 0,
            httpsAgent: httpsAgent
          };
          const response = await axios.request(config);
         // console.log(response.data.product.id, response.data.product.totalAmount, response.data.product.sellerDynamics.sellRankNumber);
         if (response.data.product.isPublicationStatus == 2) {
          try {
            // Belgeyi silin ve sonucu alın
            const result = await Product.deleteOne({ _id: product._id });
        
            if (result.deletedCount === 1) {
              console.log(response.data.product.title+" -------- ASKIDA OLDUĞU İÇİN SİLİNDİ");
            } else {
              console.log(response.data.product.title+" -------- ASKIDA OLDUĞU İÇİN SİLİNİRKEN HATA OLUŞTU");
            }

            continue;
          } catch (error) {
            console.log(response.data.product.title+" -------- ASKIDA OLDUĞU İÇİN HATA OLUŞTU");
            continue;
          }
         }


         if (response.data.product.isSoldDate) {
          try {
            // Belgeyi silin ve sonucu alın
            const result = await Product.deleteOne({ _id: product._id });
        
            if (result.deletedCount === 1) {
              console.log(response.data.product.title+" -------- SATILDIĞI İÇİN SİLİNDİ");
            } else {
              console.log(response.data.product.title+" -------- SATILDIĞI İÇİN SİLİNİRKEN HATA OLUŞTU");
            }

            continue;
          } catch (error) {
            console.log(response.data.product.title+" -------- SATILDIĞI İÇİN SİLİNİRKEN HATA OLUŞTU");
            continue;
          }
         }

       

         if(response.data.product.sellerDynamics.sellRankNumber == 0) {

          if (product.reverseBot) {
              //burada tersine bot için işlem yap
              let config8 = {
                  method: 'get',
                  maxBodyLength: Infinity,
                  url: 'https://old.sitetwo.com/530-white-silver-metallic',
                  maxRedirects: 5,
                  httpsAgent: httpsAgent
                };
                const response8 = await axios.request(config8);
                const setCookieHeader = response8.headers['set-cookie'];
                const cher = cheerio.load(response8.data);
                const tokenValue = cher('#csrf_token').val();
                let asd = await makeRequest(product.urunCode, product.urunSize.id, tokenValue, setCookieHeader);
                let sizeso = asd.sizes.filter(size => !size.buyLink);
                if (sizeso == 0) continue;
                let sizesk = sizeso.map(size => size = size.price)
                const enYakinSayi = enYakinSayiyiBul(sizesk, response.data.product.totalAmount);
                let fark = enYakinSayi - response.data.product.totalAmount
                if(fark > 1) {
                  
                  let data = JSON.stringify({
                      "totalAmount": enYakinSayi-1,
                      "isCheapestProductCheck": 1
                    });
          
                    let config3 = {
                      method: 'put',
                      maxBodyLength: Infinity,
                      url: `https://www.sitetwo.com/api/v1/merchant/product/edit/${product.ilanId}`,
                      headers: { 
                        'authorization': `Bearer ${user.sitetwoAcc.Token}`, 
                        'user-agent': 'Dart/3.1 (dart:io)', 
                        'Content-Type': 'application/json'
                      },
                      maxRedirects: 0,
                      data : data,
                      httpsAgent: httpsAgent
                    };
                    const response7 = await axios.request(config3);
          
                    let total = enYakinSayi-1
          
                    console.log(response7.data.product.title+" -------- TERSİNE GÜNCELLENDİ YENİ FİYAT: "+`${total}`);

                }
                
          }
          
          continue;
        } 

          let config2 = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://www.sitetwo.com/api/v1/listing/${product.urunId}/cheapest-products-grouped-by-size`,
            headers: { 
              'authorization': `Bearer ${user.sitetwoAcc.Token}`, 
              'user-agent': 'Dart/3.1 (dart:io)'
            },
            maxRedirects: 0,
            httpsAgent: httpsAgent
          };
          const response2 = await axios.request(config2);
          let lolo = response2.data.cheapestOnSaleProductsBySize.find(x => x.size.id == product.urunSize.id)
          if (product.id == lolo.id) continue; 
          let konkona = lolo.totalAmount-1

          if (konkona < Number(product.minPrice)) {
            console.log("min fiyattan dolayı durdum");
            continue; 
          } 
          //lolo.totalAmount
          
          let data = JSON.stringify({
            "totalAmount": lolo.totalAmount-1,
            "isCheapestProductCheck": 1
          });

          let config3 = {
            method: 'put',
            maxBodyLength: Infinity,
            url: `https://www.sitetwo.com/api/v1/merchant/product/edit/${product.ilanId}`,
            headers: { 
              'authorization': `Bearer ${user.sitetwoAcc.Token}`, 
              'user-agent': 'Dart/3.1 (dart:io)', 
              'Content-Type': 'application/json'
            },
            maxRedirects: 0,
            data : data,
            httpsAgent: httpsAgent
          };
          const response3 = await axios.request(config3);

          let total = lolo.totalAmount-1

          console.log(response3.data.product.title+" -------- GÜNCELLENDİ YENİ FİYAT: "+`${total}`);
          
     } catch (error) {
        console.log("hata");
     }

   }
   myScheduledTask()
}, rastgeleSüre);
}

module.exports.start = () => {
    myScheduledTask();
};

