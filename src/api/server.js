const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

const PORT = 5000;
const dbFilePath = path.join(__dirname, 'db.json');

// Create uploads directory if not exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer setup for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage: storage });

// Helper function to read JSON file
const readDB = () => {
    try {
        const data = fs.readFileSync(dbFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { products: [] }; // Default if file doesn't exist or is corrupted
    }
};

// Helper function to write to JSON file
const writeDB = (data) => {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
};

// API to get all products
app.get('/products', (req, res) => {
    const data = readDB();
    res.json(data.products);
});

// API to add products
app.post('/products', (req, res) => {
    const { products } = req.body; // Expect an array of products
    const dbData = readDB();

    const newProducts = products.map(product => ({
        id: Date.now() + Math.random(),
        ...product,
    }));

    dbData.products = [...dbData.products, ...newProducts];
    writeDB(dbData);

    res.status(201).json(newProducts);
});

// API to delete a product by ID
app.delete('/products/:id', (req, res) => {
    const productId = parseFloat(req.params.id); // Ensure ID is correctly parsed as a number
    const dbData = readDB();
    const products = dbData.products.filter(product => product.id !== productId);

    if (products.length === dbData.products.length) {
        return res.status(404).json({ error: 'Product not found' });
    }

    dbData.products = products;
    writeDB(dbData);

    res.status(200).json({ message: 'Product deleted' });
});

// API for image upload
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.status(201).json({ path: `/uploads/${req.file.filename}` });
});

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});