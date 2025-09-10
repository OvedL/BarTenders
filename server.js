const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

// MySQL connection
const db = mysql.createConnection({
  host: "sql5.freesqldatabase.com",
  user: "sql5797996",
  password: "U5pq16zj2J",
  database: "sql5797996",
  port: 3306
});

// Test connection
db.connect(err => {
  if (err) {
    console.error("Database connection failed: " + err.stack);
    return;
  }
  console.log("Connected to MySQL database!");
})

// Serve all static files (HTML, CSS, JS) from current folder
app.use(express.static(path.join(__dirname)));

// Default route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
