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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MySQL connection pool to allow for more users at the same time
const dbOptions = {
  host: "sql5.freesqldatabase.com",
  user: "sql5804890",
  password: "2ii6tIe39h",
  database: "sql5804890",
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

// Return logged-in user's profile info
app.get('/api/userinfo', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const query = `
    SELECT 
      firstName,
      lastName,
      email,
      phoneNumber,
      city,
      state,
      zipcode,
      createdAt,
      credentialID
    FROM USER_INFO
    WHERE userID = ?;
  `;

  db.query(query, [req.session.userId], (err, results) => {
    if (err) {
      console.error("Database error fetching user info:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(results[0]); // send user info as JSON
  });
});

//Update User Info
app.put("/api/userinfo", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const { email, phoneNumber, city, state, zipcode } = req.body || {};

    const updates = [];
    const values = [];

    if (email !== undefined) { updates.push("email = ?"); values.push(email); }
    if (phoneNumber !== undefined) { updates.push("phoneNumber = ?"); values.push(phoneNumber); }
    if (city !== undefined) { updates.push("city = ?"); values.push(city); }
    if (state !== undefined) { updates.push("state = ?"); values.push(state); }
    if (zipcode !== undefined) { updates.push("zipcode = ?"); values.push(zipcode); }

    if (updates.length === 0) return res.status(400).json({ error: "No valid fields provided" });

    values.push(userId);

    const sql = `UPDATE USER_INFO SET ${updates.join(", ")} WHERE userID = ?`;

    // Important: use db.promise() on the pool
    await db.promise().execute(sql, values);

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating user info:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Send Interested in Bartending Form
app.post("/apply-bartender", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  const userID = req.session.userId;
  const { years, bio, city, state, priorEvents } = req.body;

  if (!years || !bio || !city || !state || !priorEvents) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  const query = `
    INSERT INTO BARTENDER (yearsOfService, bio, city, state, priorEvents, userID)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [years, bio, city, state, priorEvents, userID], (err) => {
    if (err) {
      console.error("Database insert error:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    // Respond with JSON success message
    res.json({ success: true, message: "Application submitted successfully!" });
  });
});

// Send Plan Event Form
app.post("/apply-event", (req, res) => {
  const userID = req.session.userId;

  if (!userID) {
    return res.status(401).json({ success: false, message: "Not logged in" });
  }

  const {
    event_name, guest_count, event_date, start_time, end_time,
    venue_name, venue_type, event_tier, drink_package, budget,
    bartender_count, glassware, ice_mgmt, signature_cocktail,
    notes, full_name, phone, email
  } = req.body;

  const queryEvent = `
    INSERT INTO EVENT_INFO (
      eventName, guestCount, eventDate, startTime, endTime,
      eventTier, drinkPackage, budget, numOfBartenders,
      glassware, cooling, sigCocktail, notes,
      fullName, phoneNumber, email, userID
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const queryVenue = `
    INSERT INTO VENUE (venueName, venueType)
    VALUES (?, ?)
  `;

  db.query(queryEvent, [
    event_name, guest_count, event_date, start_time, end_time,
    event_tier, drink_package, budget, bartender_count,
    glassware, ice_mgmt, signature_cocktail, notes,
    full_name, phone, email, userID
  ], (err) => {
    if (err) {
      console.error("Database insert error (EVENT_INFO):", err.sqlMessage);
      return res.status(500).json({ success: false, message: err.sqlMessage });
    }

    db.query(queryVenue, [venue_name, venue_type], (err) => {
      if (err) {
        console.error("Database insert error (VENUE):", err.sqlMessage);
        return res.status(500).json({ success: false, message: err.sqlMessage });
      }

      res.json({ success: true, message: "Event and Venue submitted successfully!" });
    });
  });
});


// Get all bartenders from database
app.get("/api/bartenders", async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT 
              CONCAT(u.firstName, ' ', u.lastName) AS fullName, 
              b.yearsOfService,
              b.bio,
              b.priorEvents,
              b.city,
              b.state,
              u.phoneNumber,
              u.email,
              b.active,
              b.bartenderID
            FROM BARTENDER b 
            JOIN USER_INFO u USING (userID)
            ORDER BY b.createdAt DESC;
        `);

        res.json({ success: true, bartenders: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Database error." });
    }
});

// Approve Bartender Request
app.post("/api/bartenders/approve", async (req, res) => {
  try {
    const { bartenderID } = req.body;
    if (!bartenderID) return res.status(400).json({ success: false, message: "Missing bartenderID" });

    const sql = "UPDATE BARTENDER SET active = 1 WHERE bartenderID = ?";
    const [result] = await db.promise().execute(sql, [bartenderID]);

    if (result.affectedRows === 1) {
      return res.json({ success: true });
    } else {
      return res.status(404).json({ success: false, message: "Bartender not found" });
    }

  } catch (err) {
    console.error("Error approving bartender:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Decline Bartender Request
app.post("/api/bartenders/decline", async (req, res) => {
  try {
    const { bartenderID } = req.body;
    if (!bartenderID) return res.status(400).json({ success: false, message: "Missing bartenderID" });

    const sql = "UPDATE BARTENDER SET active = 2 WHERE bartenderID = ?";
    const [result] = await db.promise().execute(sql, [bartenderID]);

    if (result.affectedRows === 1) {
      return res.json({ success: true });
    } else {
      return res.status(404).json({ success: false, message: "Bartender not found" });
    }
  } catch (err) {
    console.error("Error declining bartender:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});



// Serve all static files (HTML, CSS, JS) from current folder
app.use(express.static(path.join(__dirname)));