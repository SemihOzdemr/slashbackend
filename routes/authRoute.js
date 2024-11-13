var express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
var register = express.Router();
var login = express.Router();
var checkUser = express.Router();
const authenticateToken = require('../middlewares/jwtMiddleware.js');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

register.post('/', async function (req, res) {
//  console.log("İşlem başlatılıyor");

  try {
    const { username, password } = req.body;

    // Gelen verilerin doğruluğunu kontrol et
    if (!username || !password) {
     // console.log("Kullanıcı adı veya şifre eksik.");
      return res.status(400).send('Kullanıcı adı ve şifre gerekli');
    }

    // Kullanıcı adının benzersiz olduğunu kontrol et
    const existingUser = await User.findOne({ username });

    if (existingUser) {
     // console.log("Bir kullanıcı zaten var:", username);
      return res.status(400).send('Kullanıcı zaten var');
    }

    // Parolayı hash'le ve yeni bir kullanıcı oluştur
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();

   // console.log("Kullanıcı başarıyla oluşturuldu:", username);
    res.status(201).send('Kullanıcı oluşturuldu');
  } catch (error) {
   // console.error("Bir hata oluştu:", error.message);
    res.status(500).send('Sunucu hatası');
  }
});

login.post('/', async function (req, res) {
 // console.log("istek geldi");
  try {
    const { username, password } = req.body;

    // Kullanıcıyı veritabanında ara
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send({errorMessage:'Böyle bir kullanıcı yok !'});
    }

    // Parolanın doğruluğunu kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({errorMessage:'Geçersiz parola !'});
    }

    // JWT oluştur
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '18000000' });

    res.json({ token });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

checkUser.get('/',authenticateToken, async function (req, res) {
  
  res.json({errorMessage: false, status: true})
  

});


module.exports = {register, login, checkUser};
