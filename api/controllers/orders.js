const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');
const { productCount } = require('../controllers/products');
const uuid = require('uuid'); 

exports.getAllOrders = (req, res, next) => {
    if (req.userData.userType == 'user') {
        console.log(req.userData);
        Order
            .find({ user: req.userData.userId })
            .select()
            .sort("-created_at")
            .populate({
                path: 'product',
                populate: {
                    path: 'category'
                }
            })
            .populate('user')
            .exec()
            .then(orders => {
                return res.status(200).json({
                    count: orders.length,
                    orders: orders
                });
            })
            .catch(error => {
                next(error);
            })
        return
    }

    let o;
    if (req.userData.userType == 'admin' && req.query.all)
        o = Order.find()
    else {
        o = Order
            .find({ user: req.userData.userId })
    }

    o.select()
        .populate({
            path: 'product',
            populate: {
                path: 'category'
            }
        })
        .populate('user')
        .sort("-created_at")
        .exec()
        .then(orders => {
            res.status(200).json({
                count: orders.length,
                orders: orders
            });
        })
        .catch(error => {
            next(error);
        })
};

exports.saveOrders = async (req, res, next) => {
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let address = req.body.address;

    console.log(req.body.products);

    let carts
    try {
        carts = JSON.parse(JSON.stringify(req.body.products));
        if (!firstName.trim() || !lastName.trim() || !address.trim()) {
            res.status(400)
            res.json({
                error: {
                    message: 'firstName , lastName , address Required..'
                }
            })
            return
        }
    } catch (error) {
        res.status(400)
        if (!carts) {
            res.json({
                error: {
                    message: 'Products Required..'
                }
            })
            return
        }
        res.json({
            error: {
                message: 'firstName , lastName , address Required..'
            }
        })
        return
    }

    let orders = [];
    const orderRef = uuid.v1();
    for (let i = 0; i < carts.length; i++) {
        orders.push(createOrder(req, res, carts[i], firstName, lastName, address, orderRef, next));
    }

    const totalPrice = orders.reduce((a, b) => +a + +b.price, 0);
    Order.create(orders)
        .then(orders => {
            return res.status(201).json({
                message: 'Orders was created',
                totalPrice: totalPrice,
                orders
            });
        })
        .catch(error => {
            next(error);
        });

    //update stock product
    orders.forEach(async item => {
        const stock = await Product.findById(item.product).exec().then(item => {
            return item.stock;
        });
        const newStock = stock - item.quantity;
        Product
            .update({ _id: item.product }, { $set: { stock: newStock } })
            .exec()
            .then(result => {
                res.status(200).json({
                    message: 'Updated Product Successfully!',
                    result: result
                });
            })
            .catch(error => {
                next(error);
            })
    })
    
};

exports.getOneOrder = (req, res, next) => {
    const orderId = req.params.orderId;
    Order
        .findById(orderId)
        .select()
        .populate('product user')
        .exec()
        .then(order => {
            return res.status(201).json(order);
        })
        .catch(error => {
            next(error);
        });
};

exports.updateOneOrder = (req, res, next) => {
    const orderId = req.params.orderId;
    Order
        .update({ _id: orderId }, { $set: req.body })
        .exec()
        .then(result => {
            return res.status(200).json({
                message: 'Updated Order Successfully!',
                result: result
            });
        })
        .catch(error => {
            next(error);
        });
};



exports.deleteOneOrder = (req, res, next) => {
    const orderId = req.params.orderId;
    Order
        .remove({ _id: orderId })
        .exec()
        .then(result => {
            return res.status(200).json({
                message: 'Deleted order!',
                result: result
            });
        })
        .catch(error => {
            next(error);
        });
};


function createOrder(req, res, productInfo, firstName, lastName, address, orderRef, next) {
    const id = productInfo.productId;
    Product
        .findById(id)
        .select('_id name price productImage category stock')
        .populate('category')
        .exec()
        .then(product => {
            if (product.stock < 1) {
                res.status(500)
                res.json({
                    message: `Product ${product.name} stock is empty`,
                });
                return
            } else if (productInfo.quantity > product.stock) {
                res.status(500)
                res.json({
                    message: `Product ${product.name} less than stock`
                });
                return
            }
        })
        .catch(error => {
            next(error);
        });
    
    return new Order({
        _id: mongoose.Types.ObjectId(),
        product: productInfo.productId,
        quantity: productInfo.quantity,
        price: productInfo.price,
        user: req.userData.userId,
        orderRef: orderRef,
        paymentMethod: req.body.paymentMethod,
        firstName,
        lastName,
        address
    });
}