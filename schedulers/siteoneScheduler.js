const axios = require('axios');
const mongoose = require('mongoose');
const Product = require('../models/siteoneProductModel');
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
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
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
      console.log("bura 2");
    return false;
  }
}


async function refreshToken(userid) {
  let user = await User.findOne({ _id: userid }); 
 try {
  let cookies = [];   
  if(!user.siteoneAcc.Cookies) return false;
  if(user.siteoneAcc.Cookies.length == 0) return false;
  let Checko = await checkLogin(user.siteoneAcc.Cookies);
  if (Checko) return true;

  let nonce = await getLoginNonce();

  if (!nonce) return false;

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
    await User.updateOne({ _id: userid }, { siteoneAcc: {Email: `${user.siteoneAcc.Email}`, Password: `${user.siteoneAcc.Password}`, Cookies: cookies}});
    return true;
  } else {
    return false;
  }
   

  

 } catch (error) {
      console.log(error);
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



  function enYakinSayiyiBul(dizi, hedef) {
    return dizi.reduce((onceki, mevcut) => {
      return Math.abs(mevcut - hedef) < Math.abs(onceki - hedef) ? mevcut : onceki;
    });
  }



async function myScheduledTask() {


    const rastgeleSüre = Math.random() * (900000 - 300000) + 300000;
    console.log("siteone süre: "+ rastgeleSüre);

    setTimeout(async () => {
    let userDatas = [];
    var suankiSaat = new Date().getHours();
    let savedProducts = await Product.find().populate('user');
    for (const product of savedProducts) {
      await sleep(15000)
     /* if (suankiSaat >= baslangicSaati && suankiSaat < bitisSaati) {
        console.log("saat duraklaması siteone");
        continue;
      }*/
  
      if (!product.botActive) continue;
     try {
      let checkedtoken = await refreshToken(product.user._id)
      if (!checkedtoken) continue;
      let user = await User.findOne({ _id: product.user._id });
      var datako = userDatas.find(x => x.userid == product.user._id) || null
      if (!datako) {
        console.log("bura çalıştı");
        let res = await getProducts(user.siteoneAcc.Cookies);
        if(!res) continue;
        userDatas.push({userid: product.user._id, data: res})
        datako = {userid: product.user._id, data: res}
      }
      let prductres = datako?.data?.find(x => x.id == product.ilanId);
      console.log("storecontrol");
      if(!prductres) {
        try {
          // Belgeyi silin ve sonucu alın
          const result = await Product.deleteOne({ _id: product._id });
      
          if (result.deletedCount === 1) {
            console.log(response.data.product.title+" -------- store ASKIDA OLDUĞU veya SATILDIĞI İÇİN SİLİNDİ");
          } else {
            console.log(response.data.product.title+" -------- store ASKIDA OLDUĞU veya SATILDIĞI İÇİN SİLİNİRKEN HATA OLUŞTU");
          }

          continue;
        } catch (error) {
          console.log(response.data.product.title+" -------- store ASKIDA OLDUĞU veya SATILDIĞI İÇİN HATA OLUŞTU");
          continue;
        }
      }

      let confignonce = {
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
          'Cookie': user.siteoneAcc.Cookies.join('; ')
        },
        maxRedirects: 50,
        httpsAgent: httpsAgent
      };
      const responsenonce = await axios.request(confignonce);
      const $ = cheerio.load(responsenonce.data);
      const scriptContent = $('#siteone-register-js-js-extra').html();
      const nonceMatch = scriptContent.match(/"nonce":"([a-zA-Z0-9]+)"/);
      const nonce = nonceMatch ? nonceMatch[1] : null;

      if (!nonce) continue;
      if(prductres.sıra == "1") {
        if (product.reverseBot) {
          try {
            
         if (prductres.sıradaki_ürünlerin_fiyatları.length == 0) continue; 
          let aka = prductres.sıradaki_ürünlerin_fiyatları.map(x => {
            let temizlenmisDeger = x.replace('₺', '').replace(',', '.');
            return parseFloat(temizlenmisDeger);
        });
        let bizimfiyat = parseFloat(prductres.fiyat.replace('₺', '').replace(',', '.'))
        let enyakinfiyat = enYakinSayiyiBul(aka, bizimfiyat);
        let guncellenecekfiyat = enyakinfiyat - 25;
        if(bizimfiyat == guncellenecekfiyat) continue;
        let datarev = qs.stringify({
          'action': 'update_product_price',
          'product_id': `${prductres.id}`,
          'product_price': `${guncellenecekfiyat}`,
          'nonce': `${nonce}` 
        });
  
        let configrev = {
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
            'Cookie': user.siteoneAcc.Cookies.join('; ')
          },
          maxRedirects: 50,
          data : datarev,
          httpsAgent: httpsAgent
        };

        const responserev = await axios.request(configrev);



        console.log(responserev.status);
        console.log(prductres.adı+" -------- siteone TERSİNE GÜNCELLENDİ YENİ FİYAT: "+`${guncellenecekfiyat}`);

      } catch (error) {
        
            console.log("hata");
      }  
      }

         continue;
      }

      let bizimfiyat = parseFloat(prductres.fiyat.replace('₺', '').replace(',', '.'))
      let endusukfiyat = parseFloat(prductres.en_düşük_fiyat.replace('₺', '').replace(',', '.'))
      if(bizimfiyat == endusukfiyat) continue;
      let guncellenecekfiyat = endusukfiyat - 25;
      if (guncellenecekfiyat < Number(product.minPrice)) {
        console.log("min fiyattan dolayı durdum siteone");
        continue; 
      } 
      let datarev = qs.stringify({
        'action': 'update_product_price',
        'product_id': `${prductres.id}`,
        'product_price': `${guncellenecekfiyat}`,
        'nonce': `${nonce}` 
      });

      let configrev = {
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
          'Cookie': user.siteoneAcc.Cookies.join('; ')
        },
        maxRedirects: 50,
        data : datarev,
        httpsAgent: httpsAgent
      };

      const responserev = await axios.request(configrev);
      console.log(responserev.status);
      console.log(prductres.adı+" -------- GÜNCELLENDİ YENİ FİYAT: "+`${guncellenecekfiyat}`);




     } catch (error) {
      console.log(error);
      console.log("hata");
   }


     }

  
   myScheduledTask()
}, rastgeleSüre);
}

module.exports.start = () => {
    myScheduledTask();
};

