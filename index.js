const express = require('express');
const hbs = require('express-handlebars');
const app = express();
const multer = require('multer');
const path = require('path');

require("dotenv").config();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Generate a unique file name for each uploaded image
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });


const PORT = process.env.PORT;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

///Biến user này dùng để lưu thông tin đăng nhập
var user = null;

//Biến toàn cục chứa danh sách sản phẩm
var products = [
    { "id": 1, "name": "Product test 1", "price": 30 },
    { "id": 2, "name": "Product test 2", "price": 20 },
    { "id": 3, "name": "Product test 3", "price": 10 },
    { "id": 4, "name": "Product test 4", "price": 15 }
];

// Configure Handlebars view engine
app.engine('handlebars', hbs.engine({
    defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');

//Method GET route '/' Hiển thị giao diện
app.get('/', (req, res) => {
    //nếu người dùng chưa đăng nhập, thực hiện redirect về trang đăng nhập
    if (user === null) {
        res.redirect('/login');
    } else {
        res.render('home', { products: products });
        console.log("🚀 ~ file: index.js:54 ~ app.get ~ products:", products.length);
    }
});

//Method GET route '/login' Hiển thị giao diện
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

//Method GET route '/add' Hiển thị giao diện
app.get('/add', upload.single('image'), (req, res) => {
    res.render('add', { error: null });
});

//Method GET route '/detail' Hiển thị giao diện
app.get('/detail', (req, res) => {
    res.render('detail', { error: null });
});

//Method POST route '/add'. Thực hiện thêm mới sản phẩm
app.post('/add', upload.single('image'), async (req, res) => {
    const { productName, price, description } = req.body;
    console.log("🚀 ~ file: index.js:74 ~ app.post ~ description:", description);
    console.log("🚀 ~ file: index.js:74 ~ app.post ~ price:", price);
    console.log("🚀 ~ file: index.js:74 ~ app.post ~ productName:", productName);
    const image = req.file; // Đối tượng file ảnh được gửi lên
    console.log("🚀 ~ file: index.js:78 ~ app.post ~ image:", image);

    // Validation
    if (!productName || !price || !description || !image) {
        // Hiển thị thông báo lỗi nếu thiếu thông tin
        return res.render('add', { errorMessage: 'Vui lòng điền đầy đủ thông tin sản phẩm.' });
    }
    // Generate a unique ID for the new product
    const productId = generateProductId();

    // Create a new product object
    const newProduct = {
        id: productId,
        productName,
        price,
        description,
        image: image.filename, // Store the filename in the product object
    };

    // Add the new product to the 'products' array or save it to your database
    products.push(newProduct);

    res.redirect('/');
});

// Function to generate a unique product ID (you can adjust this as needed)
function generateProductId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Method POST route '/delete'. Thực hiện xóa sản phẩm
app.post('/delete', (req, res) => {
    // Lấy số id của sản phẩm cần xóa
    const id = req.body.id;

    // Tìm kiếm sản phẩm cần xóa
    const product = products.find(product => product.id === id);

    // Nếu không tìm thấy sản phẩm, trả về lỗi 404
    if (!product) {
        res.status(404).render('404');
        return;
    }

    // Xóa sản phẩm khỏi danh sách sản phẩm
    products = products.filter(product => product.id !== id);

    // Fill vào chỗ trống bằng các sản phẩm bên dưới
    for (let i = 0; i < products.length; i++) {
        products[i].id = i + 1;
    }

    // Redirect về trang chủ
    res.redirect('/');
});

//Method POST route '/login'. Thực hiện đăng nhập và redirect về home
app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Kiểm tra thông tin đăng nhập
    if (email === EMAIL && password === PASSWORD) {
        user = { email, password };
        res.redirect('/');
    } else {
        res.render('login', { error: 'Sai email hoặc mật khẩu' });
    }
});

//Method GET route '/:id'. Lấy thông tin product theo số id
app.get("/:id", (req, res) => {
    // Lấy số id của sản phẩm từ request
    const id = req.params.id;

    // Tìm kiếm sản phẩm theo số id
    const product = products.find(product => product.id === id);

    // Nếu không tìm thấy sản phẩm, trả về lỗi 404
    if (!product) {
        res.status(404).render('404');
        return;
    }

    // Trả về thông tin sản phẩm
    res.render('detail', { product });
});

// custom 404 page
app.use((req, res) => {
    res.status(404);
    res.render('404');
});
// custom 500 page
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(500);
    res.render('500');
});

app.listen(PORT, () => console.log(
    'Express started on http://localhost:' + PORT + '; ' +
    'press Ctrl-C to terminate. '));