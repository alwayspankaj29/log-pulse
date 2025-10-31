const express = require('express');
const app = express();
const PORT = 3000;

// Default route
app.get('/', (req, res) => {
  res.send('Bhai, Logs!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
