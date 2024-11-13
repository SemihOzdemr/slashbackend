# Otomatik Fiyat Yönetim Sistemi - Backend

Bu proje, iki farklı yeniden satış sitesinde otomatik fiyat düşürme ve geri çekme işlemlerini yönetmek amacıyla geliştirilmiş bir backend uygulamasıdır. Sistem, belirlenen kriterlere göre ürün fiyatlarını otomatik olarak düşürmekte ve gerektiğinde fiyatları yeniden yükseltmektedir.

> **Not:** Güvenlik ve gizlilik nedeniyle, sistemin çalışması için gereken site bilgileri sansürlenmiştir. Bu yüzden proje doğrudan çalışabilir durumda değildir. Gerekli bilgiler eklendiğinde sistem işlevsel hale gelecektir.

## Özellikler
- **Otomatik Fiyat Düşürme:** Kullanıcı tanımlı eşik değerlere göre ürün fiyatını kademeli olarak düşürür.
- **Fiyat Geri Çekme İşlevi:** Ürün belirli bir süre boyunca satılmazsa, sistem fiyatı yeniden yükseltir. Bu özellik, ürünlerin belirlenen alt sınırın altına düşmesini önlemek için geliştirilmiştir.
- **Çoklu Platform Desteği:** Aynı anda birden fazla satış platformunda fiyat yönetimi yapılabilir.

## Teknik Bilgiler
- **Dil:** Node.js
- **Veritabanı:** MongoDB
