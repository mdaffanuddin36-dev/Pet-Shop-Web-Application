const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Step 1: Connect without a database name to ensure the database exists
const initialConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root' // Add your password here if you have one
});

initialConnection.query(`CREATE DATABASE IF NOT EXISTS pet_shop`, (err) => {
    if (err) {
        console.error("Error creating database:", err);
        return;
    }
    console.log("Database 'pet_shop' verified/created successfully.");
    initialConnection.end();

    // Step 2: Now initialize the connection pool specifying the database
    const db = mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'root', // Add your password here if you have one
        database: 'pet_shop',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // Make `db` accessible to routes by attaching it or keeping it in scope
    app.locals.db = db;

    // Create Tables & Seed Sample Data
    const createProductsTable = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sku VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL,
            quantity_in_stock INT NOT NULL,
            reorder_threshold INT NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL
        )
    `;

    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `;

    db.query(createProductsTable, (err) => {
        if (err) console.error("Error creating products table:", err);
        else {
            db.query('SELECT COUNT(*) as count FROM products', (err, results) => {
                if (!err && results[0].count === 0) {
                    const seedQuery = `
                        INSERT INTO products (sku, name, category, quantity_in_stock, reorder_threshold, unit_price) VALUES 
                        ('CAT-FOOD-01', 'Me-O Cat Food Adult (1kg)', 'Food', 25, 5, 350.00),
                        ('DOG-TOY-02', 'Interactive Rubber Dog Chew Toy', 'Accessories', 15, 3, 499.00),
                        ('VET-CARE-03', 'Pet Grooming & Care Session', 'Treatment', 10, 2, 899.00)
                    `;
                    db.query(seedQuery);
                }
            });
        }
    });

    db.query(createUsersTable, (err) => {
        if (err) console.error("Error creating users table:", err);
        else console.log("Products and Users tables verified/ready.");
    });

    // API Routes
    app.get('/', (req, res) => {
        res.json({ message: "Welcome to the Pet Shop Inventory & Supply Chain API (MySQL Connected)" });
    });

    app.get('/products', (req, res) => {
        db.query('SELECT * FROM products', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    app.post('/products', (req, res) => {
        const { sku, name, category, quantity_in_stock, reorder_threshold, unit_price } = req.body;
        const query = `INSERT INTO products (sku, name, category, quantity_in_stock, reorder_threshold, unit_price) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [sku, name, category, Number(quantity_in_stock), Number(reorder_threshold), Number(unit_price)];

        db.query(query, values, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: "Product with this SKU already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: result.insertId, sku, name, category, quantity_in_stock, reorder_threshold, unit_price });
        });
    });

    app.post('/register', (req, res) => {
        const { name, email, password } = req.body;
        const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
        
        db.query(query, [name, email, password], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: "Email is already registered!" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "User registered successfully!", userId: result.insertId });
        });
    });

    app.post('/login', (req, res) => {
        const { email, password } = req.body;
        const query = `SELECT * FROM users WHERE email = ? AND password = ?`;

        db.query(query, [email, password], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) {
                return res.status(401).json({ error: "Invalid email or password!" });
            }
            res.json({ message: "Login successful!", user: { id: results[0].id, name: results[0].name, email: results[0].email } });
        });
    });

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});