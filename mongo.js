const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
mongoose.connect("mongodb://localhost:27017/backend", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));
  const User = require('./models/userModel');
  const update = {
    sitetwoAcc: {} // Güncellemek istediğiniz alan ve yeni değeri
  };
  
/*setTimeout(async () => {
       // Parolayı hash'le ve yeni bir kullanıcı oluştur
       const hashedPassword = await bcrypt.hash("47Oj/rIRz4*vMgOIa>qf", 12);
       const newUser = new User({ username:'WHCr<:mRo]4,!U5&re', password: hashedPassword });
   
       await newUser.save();
   
  // await User.updateOne({ _id: veri._id }, { sitetwoAcc: null});
 
  console.log(veri);
  
}, 1000);*/

 