const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: function (origin, callback) {
        // This allows any URL that ends with .vercel.app to talk to your server
        if (!origin || origin.endsWith(".vercel.app")) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    }, 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.options('*', cors());
app.use(express.json());

// --- DATABASE CONNECTION ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'test',
    port: process.env.DB_PORT || 4000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        minVersion: 'TLSv1.2',
        ca: fs.readFileSync(path.join(__dirname, 'isrgrootx1.pem')),
    }
});

// Check connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to TiDB Cloud MySQL database.');
        connection.release();
    }
});

// --- TRANSACTION SECTION ---

app.post('/api/transactions', (req, res) => {
    const { email, type, category, amount, date, description } = req.body;
    if (!email || !amount || !type) return res.status(400).json({ error: 'Missing fields' });

    const sql = `INSERT INTO transactions 
                 (user_email, transaction_type, category, amount, t_date, description) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [email, type, category, amount, date, description], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ success: true, message: 'Transaction saved!' });
    });
});

app.get('/api/dashboard-stats/:email', (req, res) => {
    const email = req.params.email;
    const sql = `SELECT 
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as totalIncome,
            SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as totalExpenses
        FROM transactions WHERE user_email = ?`;

    db.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        const stats = results[0];
        const income = parseFloat(stats.totalIncome || 0);
        const expenses = parseFloat(stats.totalExpenses || 0);
        res.json({ income, expenses, balance: income - expenses });
    });
});

app.get('/api/history/:email', (req, res) => {
    const email = req.params.email;
    const search = req.query.search || '';
    
    const sql = `SELECT * FROM transactions 
                 WHERE user_email = ? AND description LIKE ? 
                 ORDER BY t_date DESC`;
    
    db.query(sql, [email, `%${search}%`], (err, rows) => {
        if (err) {
            console.error('Error fetching history:', err);
            return res.status(500).send('Server error');
        }
        res.json(rows);
    });
});

// --- AUTH ROUTES ---

app.post('/signup', async (req, res) => {
    const { fullname, username, password } = req.body;
    if (!fullname || !username || !password) return res.status(400).send('Fields required');

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (fullname, email, password_hash) VALUES (?, ?, ?)';
        db.query(sql, [fullname, username, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Database error');
            }
            res.status(201).send('User registered successfully!');
        });
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [username], async (err, results) => {
        if (err || results.length === 0) return res.status(401).send('Invalid credentials');
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
            res.json({ message: 'Login successful!', user: { fullname: user.fullname, email: user.email } });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

app.listen(PORT, () => {
    console.log(`SERVER LIVE: Port ${PORT}`);
});