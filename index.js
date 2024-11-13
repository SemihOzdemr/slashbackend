require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const {register, login, checkUser} = require('./routes/authRoute.js');
const { siteoneLogin, siteoneInfo, siteoneProducts, siteoneProductSave } = require('./routes/sitetwoRoute.js');
const { siteoneLogin, siteoneInfo, siteoneProducts, siteoneProductSave } = require('./routes/siteoneRoute.js');
const sitetwoScheduler = require('./schedulers/sitetwoScheduler.js');
const siteoneScheduler = require('./schedulers/siteoneScheduler.js');

var suankiSaat = new Date().getHours();
console.log("saat: "+suankiSaat);

const app = express();
app.use(bodyParser.json());
app.use(cors());



// MongoDB'ye bağlan
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));


// özel bir sistem olduğu için kayıt kapalı
//app.use('/register', register);
app.use('/HBSGmcdlBd', login);
app.use('/jbVnRBYQsM', checkUser);
app.use('/HyASVabahS', siteoneLogin);
app.use('/NTXmDwUxQx', siteoneInfo);
app.use('/QMgJeSOeVg', siteoneProducts);
app.use('/pnsgSlWIRv', siteoneProductSave);
app.use('/arh1XfB3Dx', siteoneLogin);
app.use('/njiAhSvPyT', siteoneInfo);
app.use('/OkQo66kc3F', siteoneProducts);
app.use('/dQl7AROodQ', siteoneProductSave);


// zamanlayıcılar
sitetwoScheduler.start();
siteoneScheduler.start();

app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
