const jwt = require('jsonwebtoken');

// JWT kontrol middleware'i
function authenticateToken(req, res, next) {
  // Header'dan veya başka bir yerden token'ı al
  const authHeader = req.headers['authorization'];
// console.log(authHeader);
  // Token yoksa erişimi reddet
  if (authHeader == null) return res.sendStatus(401);

  jwt.verify(authHeader, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ errorMessage: "Oturum hatalı veya süresi dolmuş !"});
      
   // console.log(user);
    // Kullanıcı bilgilerini istek nesnesine ekleyin
    req.user = user;

    // Bir sonraki middleware fonksiyonuna geç
    next();
  });
}

module.exports = authenticateToken;