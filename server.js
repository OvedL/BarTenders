require('dotenv').config();

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// Middleware to parse HTML forms and json
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// MySQL connection pool to allow for more users at the same time
const dbOptions = {
  host: "sql5.freesqldatabase.com",
  user: "sql5803838",
  password: "8WhTd7sUPJ",
  database: "sql5803838",
  port: 3306,
  connectionLimit: 10,
  connectTimeout: 10000
};

const db = mysql.createPool(dbOptions);


// Test pool connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database (via pool)!");
  connection.release();
})


// Session store
const sessionStore = new MySQLStore(dbOptions);


// Session Middleware
app.use(session({
  key: "bartenders_session_name",
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }

}));


// Serve all static files (HTML, CSS, JS) from current folder
app.use(express.static(path.join(__dirname)));


// Default route to the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// Signup route
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, confirmPassword} = req.body;

  if (password !== confirmPassword) return res.send("Passwords do not match!");

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO USER_INFO (firstName, lastName, email, phoneNumber, password) VALUES (?, ?, ?, ?, ?)",
      [firstName, lastName, email, phoneNumber, hashedPassword],
      (err) => {
        if (err) return res.send("Error creating user: " + err.message);
        res.redirect('/dashboard');
      }
    );
  } catch (err) {
    res.send("Server error: " + err.message);
  }
});


// Login route  
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM USER_INFO WHERE email = ?", [email], async (err, results) => {
    if (err) return res.send("Database error: " + err.message);
    if (err || results.length === 0) return res.send("Invalid email or password");

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.send("Invalid email or password");

    req.session.userId = user.userID;
    req.session.credentialID = user.credentialID;
    
    res.redirect('/index.html');
  });
});


// Protected dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.send(`Welcome! You are logged in as user ID ${req.session.userId}`);
});


// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    res.clearCookie("bartenders_session_name");
    if (err) return res.json({ success: false });
    res.json({ success: true, redirect: '/index.html' });  
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Session status endpoint for the navbar
app.get('/api/session', (req, res) => {
  res.json({ 
    loggedIn: !!req.session.userId, 
    credentialID: req.session.credentialID
  });
});

