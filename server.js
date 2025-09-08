const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve all static files (HTML, CSS, JS) from current folder
app.use(express.static(path.join(__dirname)));

// Default route (optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
