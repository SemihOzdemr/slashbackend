
const mongoose = require('mongoose'); 

const siteoneProductModel = mongoose.Schema({
    ilanId: Number,
    urunId: String,
    urunCode: String,
    urunSize: Object,
    minPrice: String,
    botActive: Boolean,
    reverseBot: Boolean,
    activites: Array,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  })

module.exports = mongoose.model("siteoneProduct", siteoneProductModel)