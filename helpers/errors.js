// helpers/errors.js
// Centralised error definitions and accessor helpers.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

// Transform error_report.json data to API format
function transformErrorReportData(errorReportData) {
  if (!errorReportData || !errorReportData.errors) {
    return [];
  }

  return errorReportData.errors.map((error, index) => {
    const analysis = error.analysis || {};

    // Extract title from stack trace content or generate one
    let title = "Unknown Error";
    try {
      const content = JSON.parse(error.content);
      if (content.log && content.log.kind) {
        title = `${content.log.kind} - ${analysis.category || "System"} Issue`;
      } else if (content.log && content.log.dynamic_data) {
        // Extract meaningful title from dynamic_data
        const dynamicData = content.log.dynamic_data;
        if (dynamicData.includes("enum element")) {
          title = "Enum Naming Conflict Warning";
        } else if (dynamicData.includes("Stack Trace")) {
          title = `${analysis.category || "Thread"} Management Issue`;
        } else {
          title = dynamicData.split("\n")[0].substring(0, 50) + "...";
        }
      }
    } catch (e) {
      // If JSON parsing fails, extract title from raw content
      if (error.content.includes("enum element")) {
        title = "Enum Naming Conflict Warning";
      } else if (error.content.includes("THREAD_NEW_CALL")) {
        title = `${analysis.category || "Thread"} Management Issue`;
      }
    }

    return {
      id: `error_${error.lineNumber}`,
      title: title,
      description: analysis.description || "No description available",
      recommendation:
        analysis.suggestedAction || "Manual investigation required",
      severity: analysis.severity || "UNKNOWN",
      category: analysis.category || "Other",
      impact: analysis.impact || "Unknown impact",
      timestamp: error.timestamp || new Date().toISOString(),
      lineNumber: error.lineNumber,
      content: error.content,
      slackThreadSuggestion: analysis.slackthread || "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y",
    };
  });
}

// Generate fresh error analysis by running the backend analysis script
async function generateErrorAnalysis() {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, "..", "backend");
    const logFilePath = path.join(backendPath, "production.log");
    const analysisScript = path.join(backendPath, "index.js");

    console.log("🔄 Generating fresh error analysis...");

    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      console.log(
        "⚠️ No production.log found, using existing error_report.json if available"
      );
      resolve(true);
      return;
    }

    // Run the backend analysis script
    const analysisProcess = spawn("node", [analysisScript, logFilePath], {
      cwd: backendPath,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    analysisProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    analysisProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    analysisProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Error analysis completed successfully");
        resolve(true);
      } else {
        console.error("❌ Error analysis failed:", stderr);
        // Don't reject, just log and continue with existing data
        resolve(false);
      }
    });

    analysisProcess.on("error", (error) => {
      console.error("❌ Failed to start analysis process:", error.message);
      // Don't reject, just log and continue with existing data
      resolve(false);
    });
  });
}

// Load error report data with fresh analysis generation
async function loadErrorReportData() {
  try {
    // First, generate fresh analysis
    await generateErrorAnalysis();

    // Then load the generated data
    const errorReportPath = path.join(
      __dirname,
      "..",
      "backend",
      "error_report.json"
    );
    const rawData = fs.readFileSync(errorReportPath, "utf8");
    const errorReportData = JSON.parse(rawData);
    return transformErrorReportData(errorReportData);
  } catch (error) {
    console.error("Error loading error_report.json:", error.message);
    // Return fallback data if file cannot be loaded
    return [
      {
        id: "fallback_error",
        title: "Error Loading Log Analysis",
        description:
          "Unable to load error analysis data from error_report.json",
        recommendation:
          "Check if error_report.json file exists and is valid JSON",
        severity: "HIGH",
        category: "System",
        impact: "Dashboard functionality impaired",
        timestamp: new Date().toISOString(),
        lineNumber: 0,
        content: "Fallback error entry",
        slackThreadSuggestion: null,
      },
    ];
  }
}

async function getAllErrors() {
  return await loadErrorReportData();
}

async function getErrorById(id) {
  const errors = await loadErrorReportData();
  return errors.find((e) => e.id === id) || null;
}

module.exports = {
  getAllErrors,
  getErrorById,
  generateErrorAnalysis,
};
