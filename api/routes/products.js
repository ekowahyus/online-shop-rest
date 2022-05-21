const express = require('express');
const router = express.Router();
const multer = require('multer');

const auths = require('../middleware/check-auth');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5
    }
});

const ProductsController = require('../controllers/products');

router.get('/', auths.userAuth, ProductsController.getAllProducts);

router.post('/', auths.adminAuth, upload.single('productImage'), ProductsController.createOneProduct);

router.get('/:productId', auths.userAuth, ProductsController.getOneProduct);

router.patch('/:productId', auths.adminAuth, ProductsController.updateOneProduct);

router.delete('/:productId', auths.adminAuth, ProductsController.deleteOneProduct);

module.exports = router;