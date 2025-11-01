const path = require("path");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Helpers
const { getAllErrors, getErrorById } = require("./helpers/errors");

// Serve dashboard as primary UI
app.get("/dashboard", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "pages", "dashboard", "index.html")
  );
});

// Optionally redirect root to /dashboard (choose ONE: redirect or 404)
app.get("/", (req, res) => {
  // Uncomment next line to redirect instead of 404
  // return res.redirect('/dashboard');
  res.status(404).json({ message: "Root path removed. Use /dashboard" });
});

// GET all errors - accepts optional logFile query parameter
// Example: /api/errors?logFile=devos.log
app.get("/api/errors", async (req, res) => {
  try {
    const logFileName = req.query.logFile; // Optional parameter
    
    if (logFileName) {
      console.log(`📁 Analyzing log file: ${logFileName}`);
    } else {
      console.log("📁 Loading existing error report");
    }
    
    const data = await getAllErrors(logFileName);
    res.json({ 
      count: data.length, 
      errors: data,
      logFile: logFileName || "existing report"
    });
  } catch (error) {
    console.error("Error fetching errors:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message,
      errors: [] 
    });
  }
});

// Optional: GET single error by id (future use by frontend)
app.get("/api/errors/:id", async (req, res) => {
  try {
    const error = await getErrorById(req.params.id);
    if (!error) {
      return res.status(404).json({ message: "Error not found" });
    }
    res.json(error);
  } catch (error) {
    console.error("Error fetching error by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Bhai Logs! running at http://localhost:${PORT}`);
});
