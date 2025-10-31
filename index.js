const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helpers
const { getAllErrors, getErrorById } = require('./helpers/errors');

// Root route - serve the frontend UI (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve dashboard at /dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard', 'index.html'));
});

// GET all errors
app.get('/api/errors', (req, res) => {
  const data = getAllErrors();
  res.json({ count: data.length, errors: data });
});

// Optional: GET single error by id (future use by frontend)
app.get('/api/errors/:id', (req, res) => {
  const error = getErrorById(req.params.id);
  if (!error) {
    return res.status(404).json({ message: 'Error not found' });
  }
  res.json(error);
});

app.listen(PORT, () => {
  console.log(`Bhai Logs! running at http://localhost:${PORT}`);
});
