const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    productImage: { type: String, require: false },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: false },
    stock: { type: Number, required: true }
});

module.exports = mongoose.model('Product', productSchema);