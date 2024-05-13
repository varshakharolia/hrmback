const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const privateKey = "test_private_key_fhdfgfdngjktdfhbkg"

const corsOptions = {
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

mongoose.connect('mongodb+srv://varsha:Varsha@123@cluster0.5ydil5b.mongodb.net/<your-database-name>?retryWrites=true&w=majority')
    .then(() => console.log('db Connected!'))
    .catch(err => console.error('Error connecting to the database:', err));


const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    contact: String,
    email: String,
    password: String,
    confirmpassword: String
});

const productSchema = new mongoose.Schema({
    productId: String,
    productName: String,
    productRate: Number,
    productQnty: Number,
    category: String,
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

app.get('/', function (req, res) {
    res.send('Hello World');
});

app.post('/register', jsonParser, function (req, res) {
    const { firstName, lastName, contact, email, password, confirmpassword } = req.body;

    const createNewUser = new User({
        firstName: firstName,
        lastName: lastName,
        contact: contact,
        email: email,
        password: password,
        confirmpassword: confirmpassword
    });

    createNewUser.save().then((result) => {
        res.status(201).json({ msg: 'New user created successfully', result, token: generateToken({ result: req.body.email }) });
    }).catch((error) => {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    });
});

function generateToken(payload) {
    var token = jwt.sign(payload, privateKey);
    return token
}

app.post('/login', jsonParser, (req, res) => {
    const { email, password } = req.body;
    User.findOne({ email: email })
        .then((result) => {
            if (result) {
                if (result.password === password) {
                    res.status(200).send({ msg: 'Login successful', result, token: generateToken({ email: email, password: password }) });
                } else {
                    res.status(401).send({ msg: 'Invalid password' }); // Send a 401 Unauthorized response
                }
            } else {
                res.status(404).send({ msg: 'Email not found' }); // Send a 404 Not Found response
            }
        })
        .catch((error) => {
            console.error('Error during login:', error);
            res.status(500).send({ msg: 'An error occurred during login' });
        });
});

// Add new product
app.post("/product", verifyToken, jsonParser, (req, res) => {
    console.log("product api")
    const { productId, productName, productQnty, productRate } = req.body;

    const createNewProduct = new Product({
        productId: productId,
        productName: productName,
        productQnty: productQnty,
        productRate: productRate,
    });

    createNewProduct.save().then((result) => {
        res.status(201).json({ msg: 'New product added successfully!', result, token: generateToken({ result: req.body.email }) });
    }).catch((e) => {
        res.status(500).json({ msg: 'Internal server error' });
    });
})

app.put("/product/:id", jsonParser, (req, res) => {
    console.log(req.body);
    const { productId, productName, productQnty, productRate } = req.body;
    const id = req.params.id;
    Product.findByIdAndUpdate({ _id: id }, {
        $set: {
            productId: productId,
            productName: productName,
            productRate: productRate,
            productQnty: productQnty,
        }
    }, { new: true }).then((result) => {
        res.status(201).json({ msg: "Updated successfully!" })
    }).catch((e) => {
        console.log(e)
        res.status(500).json({ msg: "Internal server error", e })
    })
})

app.get("/product", verifyToken, (req, res) => {
    Product.find({}).then((result) => {
        res.status(200).json(result);
    })
})

// delete a product
app.delete("/product/:id", verifyToken, (req, res) => {
    const id = req.params.id;
    Product.findByIdAndDelete(id)
      .then((result) => {
        if (!result) {
          return res.status(404).json({ msg: "Product not found" });
        }
        res.status(200).json({ msg: "Product deleted successfully" });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ msg: "Internal server error" });
      });
  });

function verifyToken(req, res, next) {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).send({ auth: false, message: 'No token provided.' });
    }
    jwt.verify(token, privateKey, function (err, decoded) {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
        }
        // if everything good, save to request for use in other routes
        req.userId = decoded.id;
        next();
    });
}

app.post('/logout', verifyToken, (req, res) => {
    res.status(200).json({ msg: 'Logout successful' });
});

app.listen(port, () => {
    console.log("server running");
});