const fs = require("fs");
const readline = require("readline");

// Gemini API configuration
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyCQ2xk-qCTDceveVcao7hzBeO3GNo700ZU";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Predefined error categories
const ERROR_CATEGORIES = [
  "Database",
  "Network",
  "Authentication",
  "Authorization",
  "Configuration",
  "Memory",
  "Disk",
  "API",
  "Timeout",
  "Connection",
  "Thread",
  "Concurrency",
  "Performance",
  "Deployment",
  "Security",
  "Validation",
  "Syntax",
  "Runtime",
  "Initialization",
  "Resource Exhaustion",
  "Other",
];

// Predefined severity levels
const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM'];

// Predefined suggested actions
const SUGGESTED_ACTIONS = [
  "Restart service immediately",
  "Check database connection",
  "Review network configuration",
  "Verify authentication credentials",
  "Update security permissions",
  "Monitor memory usage",
  "Free up disk space",
  "Review API endpoints",
  "Increase timeout limits",
  "Check connection pools",
  "Optimize thread usage",
  "Review concurrent processes",
  "Optimize performance bottlenecks",
  "Verify deployment configuration",
  "Review security settings",
  "Validate input parameters",
  "Fix syntax errors",
  "Debug runtime issues",
  "Check initialization scripts",
  "Scale resources",
  "Contact system administrator",
  "Review logs for patterns",
  "Update configuration files",
  "Restart dependent services",
  "Clear cache",
  "Update system dependencies",
  "Monitor system health",
  "Schedule maintenance window",
  "Review error handling",
  "Manual investigation required",
];

// Error patterns using regex
const ERROR_PATTERNS = [
  /error/i,
  /timeout/i,
  /exception/i,
  /fail(ed|ure)?/i,
  /critical/i,
  /fatal/i,
  // /warning/i,
  // /warn/i,
  // /severe/i,
  // /emergency/i,
  // /alert/i,
  // /stack trace/i,
  // /"level"\s*:\s*"(ERROR|WARN|FATAL|CRITICAL)"/i
];

// Check if a log line contains an error
function isError(line) {
  return ERROR_PATTERNS.some((pattern) => pattern.test(line));
}

// Extract timestamp from log line
function extractTimestamp(line) {
  try {
    const parsed = JSON.parse(line);
    return parsed.meta?.timestamp || parsed.timestamp || null;
  } catch {
    const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    return timestampMatch ? timestampMatch[0] : null;
  }
}

// Parse log file and extract errors using regex
async function parseLogFile(logFilePath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const errors = [];
    let lineNumber = 0;

    rl.on("line", (line) => {
      lineNumber++;
      if (isError(line)) {
        errors.push({
          lineNumber,
          content: line,
          timestamp: extractTimestamp(line),
        });
      }
    });

    rl.on("close", () => {
      console.log(`✅ Parsing complete. Found ${errors.length} errors.`);
      resolve(errors);
    });

    rl.on("error", (err) => {
      reject(err);
    });
  });
}

// Analyze a single error using AI
async function analyzeError(error) {
  try {
    const prompt = `You are an expert system administrator analyzing log errors. Provide concise, actionable analysis.

Analyze this log error and provide:
1. Severity rating - MUST be one of: ${SEVERITY_LEVELS.join(", ")}
2. Error category - MUST be one of: ${ERROR_CATEGORIES.join(", ")}
3. Brief description of the issue
4. Potential impact
5. Suggested action - MUST be one of: ${SUGGESTED_ACTIONS.join(", ")}

Log entry:
${error.content}

Respond ONLY with valid JSON format with keys: severity, category, description, impact, suggestedAction
IMPORTANT: Use ONLY the predefined categories, severity levels, and suggested actions listed above.`;

    // Call Gemini API using fetch
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // Extract JSON from response (remove markdown code blocks if present)
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const analysis = JSON.parse(jsonText);

    // Validate and normalize severity
    let severity = (analysis.severity || "").toUpperCase();
    if (!SEVERITY_LEVELS.includes(severity)) {
      severity = "MEDIUM"; // Default fallback
    }

    // Validate and normalize category
    let category = analysis.category || "Other";
    if (!ERROR_CATEGORIES.includes(category)) {
      // Try to find closest match
      const match = ERROR_CATEGORIES.find(
        (cat) =>
          category.toLowerCase().includes(cat.toLowerCase()) ||
          cat.toLowerCase().includes(category.toLowerCase())
      );
      category = match || "Other";
    }

    // Validate and normalize suggested action
    let suggestedAction =
      analysis.suggestedAction || "Manual investigation required";
    if (!SUGGESTED_ACTIONS.includes(suggestedAction)) {
      // Try to find closest match
      const match = SUGGESTED_ACTIONS.find(
        (action) =>
          action.toLowerCase().includes(suggestedAction.toLowerCase()) ||
          suggestedAction.toLowerCase().includes(action.toLowerCase())
      );
      suggestedAction = match || "Manual investigation required";
    }

    return {
      ...error,
      analysis: {
        severity: severity,
        category: category,
        description: analysis.description || "No description available",
        impact: analysis.impact || "Unknown impact",
        suggestedAction: suggestedAction,
      },
    };
  } catch (err) {
    console.error(`❌ Error analyzing log entry: ${err.message}`);
    return {
      ...error,
      analysis: {
        severity: "UNKNOWN",
        category: "Other",
        description: "AI analysis failed",
        impact: "Unable to determine",
        suggestedAction: "Manual investigation required",
      },
    };
  }
}

// Analyze all errors with AI in batches
async function analyzeErrors(errors) {
  if (errors.length === 0) {
    console.log("⚠️  No errors to analyze.");
    return [];
  }

  console.log(`\n🤖 Analyzing ${errors.length} errors with AI...\n`);

  const analyzedErrors = [];
  const batchSize = 5;

  for (let i = 0; i < errors.length; i += batchSize) {
    const batch = errors.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((error) => analyzeError(error))
    );
    analyzedErrors.push(...batchResults);
  }

  return analyzedErrors;
}

// Count errors by severity
function countBySeverity(errors) {
  return errors.reduce((acc, error) => {
    const severity = error.analysis.severity;
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});
}

// Count errors by category
function countByCategory(errors) {
  return errors.reduce((acc, error) => {
    const category = error.analysis.category;
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

// Get icon for severity level
function getSeverityIcon(severity) {
  const icons = {
    CRITICAL: "🔴",
    HIGH: "🟠",
    MEDIUM: "🟡",
    LOW: "🟢",
    UNKNOWN: "⚪",
  };
  return icons[severity] || "⚪";
}

// Generate report
function generateReport(analyzedErrors) {
  const report = {
    summary: {
      totalErrors: analyzedErrors.length,
      severityCounts: countBySeverity(analyzedErrors),
      categoryCounts: countByCategory(analyzedErrors),
    },
    errors: analyzedErrors.sort((a, b) => {
      const severityOrder = {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
        UNKNOWN: 4,
      };
      return (
        severityOrder[a.analysis.severity] - severityOrder[b.analysis.severity]
      );
    }),
  };

  return report;
}

// Display report in console
function displayReport(report) {
  console.log("\n" + "=".repeat(80));
  console.log("📊 ERROR ANALYSIS REPORT");
  console.log("=".repeat(80));

  console.log("\n📈 SUMMARY:");
  console.log(`   Total Errors: ${report.summary.totalErrors}`);

  console.log("\n🔥 Severity Breakdown:");
  Object.entries(report.summary.severityCounts)
    .sort(([a], [b]) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
      return order[a] - order[b];
    })
    .forEach(([severity, count]) => {
      const icon = getSeverityIcon(severity);
      console.log(`   ${icon} ${severity}: ${count}`);
    });

  console.log("\n📁 Category Breakdown:");
  Object.entries(report.summary.categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   • ${category}: ${count}`);
    });

  console.log("\n" + "=".repeat(80));
  console.log("🔍 DETAILED ERROR ANALYSIS");
  console.log("=".repeat(80));

  report.errors.forEach((error, index) => {
    const icon = getSeverityIcon(error.analysis.severity);
    console.log(`\n${icon} ERROR #${index + 1} [Line ${error.lineNumber}]`);
    console.log(`   Severity: ${error.analysis.severity}`);
    console.log(`   Category: ${error.analysis.category}`);
    console.log(`   Timestamp: ${error.timestamp || "N/A"}`);
    console.log(`   Description: ${error.analysis.description}`);
    console.log(`   Impact: ${error.analysis.impact}`);
    console.log(`   Suggested Action: ${error.analysis.suggestedAction}`);
    console.log(`   Log Content: ${error.content.substring(0, 150)}...`);
    console.log("-".repeat(80));
  });
}

// Save report to JSON file
function saveReport(report, filename = "error_report.json") {
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`\n💾 Report saved to ${filename}`);
}

// Main execution
async function main() {
  const logFilePath = process.argv[2] || "./production.log";

  console.log("🚀 Starting Log Error Analysis...");
  console.log(`📁 Log file: ${logFilePath}`);
  console.log(`\n📋 Using Predefined Categories:`);
  console.log(`   ${ERROR_CATEGORIES.join(", ")}`);
  console.log(`\n🔥 Severity Levels: ${SEVERITY_LEVELS.join(", ")}`);
  console.log(
    `\n💡 Available Actions: ${SUGGESTED_ACTIONS.length} predefined actions\n`
  );

  try {
    // Step 1: Parse log file and extract errors using regex
    const errors = await parseLogFile(logFilePath);

    if (errors.length === 0) {
      console.log("✅ No errors found in the log file.");
      return;
    }

    // Step 2: Analyze errors with AI
    const analyzedErrors = await analyzeErrors(errors);

    // Step 3: Generate and display report
    const report = generateReport(analyzedErrors);
    displayReport(report);

    // Step 4: Save report to file
    saveReport(report);
      
    console.log('\n✅ Analysis complete!');
  } catch (error) {
    console.error("❌ Error during analysis:", error.message);
    process.exit(1);
  }
}

// Run the main function
main();
