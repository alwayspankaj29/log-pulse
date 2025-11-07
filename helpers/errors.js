// helpers/errors.js
// Centralised error definitions and accessor helpers.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const {
  parseLogFile,
  analyzeErrors,
  generateReport,
  saveReport,
} = require("../backend/index");

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
      slackThreadSuggestion: analysis.slackThread || analysis.relevantUrls || null,
    };
  });
}

// Generate fresh error analysis by running the backend analysis directly
async function generateErrorAnalysis(logFileName = "devos2.log") {
  try {
    const backendPath = path.join(__dirname, "..", "backend");
    const logFilePath = path.join(backendPath, logFileName);

    console.log(`🔄 Generating fresh error analysis for: ${logFileName}`);

    // Check if log file exists
    if (!fs.existsSync(logFilePath)) {
      throw new Error(`Log file not found: ${logFilePath}`);
    }

    // Step 1: Parse log file and extract errors
    console.log("📋 Parsing log file...");
    const errors = await parseLogFile(logFilePath);

    if (errors.length === 0) {
      console.log("✅ No errors found in the log file.");
      return { success: true, errorCount: 0 };
    }

    // Step 2: Analyze errors with AI
    console.log(`🤖 Analyzing ${errors.length} errors...`);
    const analyzedErrors = await analyzeErrors(errors);

    // Step 3: Generate report
    const report = generateReport(analyzedErrors);

    //
    console.log.apply(`✅ Generated report with ${report.errors.length} analyzed errors.`);
    // Step 4: Save report to file
    const reportPath = path.join(backendPath, "error_report.json");
    saveReport(report, reportPath);

    console.log("✅ Error analysis completed successfully");
    return { success: true, errorCount: errors.length, report };
  } catch (error) {
    console.error("❌ Error during analysis:", error.message);
    throw error;
  }
}

// Load error report data with fresh analysis generation
async function loadErrorReportData(logFileName) {
  try {
    // First, generate fresh analysis if logFileName is provided
    if (logFileName) {
      await generateErrorAnalysis(logFileName);
    }

    // Then load the generated data
    const errorReportPath = path.join(
      __dirname,
      "..",
      "backend",
      "error_report.json"
    );
    
    // Check if error_report.json exists
    if (!fs.existsSync(errorReportPath)) {
      console.log("⚠️ No error_report.json found. Run analysis first.");
      return [];
    }
    
    const rawData = fs.readFileSync(errorReportPath, "utf8");
    const errorReportData = JSON.parse(rawData);
    return transformErrorReportData(errorReportData);
  } catch (error) {
    console.error("Error loading error_report.json:", error.message);
    throw error;
  }
}

async function getAllErrors(logFileName) {
  return await loadErrorReportData(logFileName);
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
