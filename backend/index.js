const fs = require("fs");
const readline = require("readline");

// Gemini API configuration
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyAX6EBm7koC6wGFJAhIol4USdUFh_oESWg";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// Predefined severity levels
const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM'];

// Predefined error categories
const ERROR_CATEGORIES = [
  {
    category: "Syntax",
    subcategories: [
      {
        subcategory: "Nil Reference Error",
        suggestion: "Add defensive programming with nil checks using safe navigation operator (&.) or presence checks. Consider using `try()` method for Rails objects. Example: `user&.name` instead of `user.name`",
        slackthread: "https://browserstack.slack.com/archives/C04ACHC6MK4/p1742366645355799",
        codeExample: "# Before: user.profile.name\n# After: user&.profile&.name || 'Guest'"
      },
      {
        subcategory: "Wrong Number of Arguments",
        suggestion: "Review method signature and caller. Use splat operator (*args) for variable arguments or keyword arguments (key:) for clarity. Run `grep -r 'def method_name'` to find definition",
        slackthread: "https://browserstack.slack.com/archives/C04ACHC6MK4/p1742366645355799",
        codeExample: "# Use: def calculate(base, **options)\n# Instead of: def calculate(base, tax, discount, shipping)"
      },
      {
        subcategory: "Undefined Method",
        suggestion: "Verify object class with `.class.inspect`. Check if method is defined in included modules/concerns. Use `respond_to?(:method_name)` before calling. Consider adding method_missing handler for better errors",
        slackthread: "https://browserstack.slack.com/archives/C04ACHC6MK4/p1742366645355799",
        codeExample: "obj.do_something if obj.respond_to?(:do_something)"
      },
      {
        subcategory: "Unexpected Data Type",
        suggestion: "Add type validation at method entry using Strong Parameters (Rails) or custom validators. Use `.is_a?(Class)` checks. Consider adding Sorbet/RBS type annotations for static analysis",
        slackthread: "https://browserstack.slack.com/archives/C04ACHC6MK4/p1742366645355799",
        codeExample: "raise TypeError unless value.is_a?(Integer)\n# Or: params.require(:user).permit(:name, :email)"
      }
    ]
  },
  {
    category: "Templating",
    subcategories: [
      {
        subcategory: "Template Rendering Error",
        suggestion: "Check instance variables passed from controller (@variable). Verify all partials receive required locals: `render partial: 'form', locals: { user: @user }`. Enable strict_locals in Rails 7.1+",
        slackthread: "https://browserstack.slack.com/archives/C02CX7JGR51/p1747988553615449",
        codeExample: "# In partial: <% # locals: (user:) %>\n# Enables compile-time checking"
      },
      {
        subcategory: "Missing Partial",
        suggestion: "Verify partial naming convention (_partial_name.html.erb). Check app/views directory structure matches render paths. Use `render partial: 'shared/header'` with explicit path. Consider view_component gem for better encapsulation",
        slackthread: "https://browserstack.slack.com/archives/C02CX7JGR51/p1747988553615449",
        codeExample: "# Correct: render 'shared/header'\n# File: app/views/shared/_header.html.erb"
      },
      {
        subcategory: "Helper Method Error",
        suggestion: "Ensure helper is in app/helpers and module name matches. Include helper explicitly in controller if needed: `helper :custom`. Test helpers in isolation. Move complex logic to service objects instead",
        slackthread: "https://browserstack.slack.com/archives/C02CX7JGR51/p1747988553615449",
        codeExample: "# Move from helper to service:\n# PricingCalculator.new(user).total_price"
      }
    ]
  },
  {
    category: "Routing",
    subcategories: [
      {
        subcategory: "Action Dispatch Error",
        suggestion: "Run `rails routes | grep pattern` to verify route exists. Ensure controller action is public method. Check routes.rb for typos in controller/action names. Use `rails routes -c ControllerName` to filter",
        slackthread: "https://browserstack.slack.com/archives/CPQLNNSNQ/p1658124157473069?thread_ts=1658124154.037049&cid=CPQLNNSNQ",
        codeExample: "# routes.rb: get '/pricing', to: 'pricing#index'\n# Requires: PricingController#index method"
      },
      {
        subcategory: "Invalid Parameters",
        suggestion: "Use Strong Parameters with .require() and .permit(). Add custom validations for complex params. Log params in development: `Rails.logger.debug params.inspect`. Never trust user input",
        slackthread: "https://browserstack.slack.com/archives/CPQLNNSNQ/p1658124157473069?thread_ts=1658124154.037049&cid=CPQLNNSNQ",
        codeExample: "def user_params\n  params.require(:user).permit(:name, :email).tap do |p|\n    p.require(:name) # Ensure name exists\n  end\nend"
      },
      {
        subcategory: "Routing Error",
        suggestion: "Verify HTTP verb matches route definition (GET, POST, PUT, DELETE). Check for conflicts with earlier route definitions. Use constraints for parameter validation. Run `rails routes --expanded` for details",
        slackthread: "https://browserstack.slack.com/archives/CPQLNNSNQ/p1658124157473069?thread_ts=1658124154.037049&cid=CPQLNNSNQ",
        codeExample: "# Use constraints:\nget '/users/:id', to: 'users#show', constraints: { id: /\\d+/ }"
      }
    ]
  },
  {
    category: "Migration",
    subcategories: [
      {
        subcategory: "ActiveRecord Query Error",
        suggestion: "Use `.to_sql` to inspect generated query. Check table/column names with `rails dbconsole`. Use `.includes()` to avoid N+1 queries. Enable query logging: `ActiveRecord::Base.logger = Logger.new(STDOUT)`",
        slackthread: "https://browserstack.slack.com/archives/CPQLNNSNQ/p1760611330675929?thread_ts=1760611251.744219&cid=CPQLNNSNQ",
        codeExample: "# Debug: User.where(name: 'test').to_sql\n# Fix N+1: User.includes(:posts).where(...)"
      },
      {
        subcategory: "Record Not Found",
        suggestion: "Use `.find_by()` instead of `.find()` to return nil. Rescue ActiveRecord::RecordNotFound in controller. Add exists? check before operations. Use `.find_or_initialize_by()` for upsert patterns",
        slackthread: "https://browserstack.slack.com/archives/CPQLNNSNQ/p1760611330675929?thread_ts=1760611251.744219&cid=CPQLNNSNQ",
        codeExample: "user = User.find_by(id: params[:id])\nreturn render_404 unless user\n# Or: rescue ActiveRecord::RecordNotFound"
      },
      {
        subcategory: "Transaction Failure",
        suggestion: "Wrap DB operations in `ActiveRecord::Base.transaction`. Check for validation errors with `.errors.full_messages`. Investigate DB constraints with `rails db:schema:dump`. Use `.save!` to raise on failure",
        slackthread: "https://browserstack.slack.com/archives/CPQLNNSNQ/p1760611330675929?thread_ts=1760611251.744219&cid=CPQLNNSNQ",
        codeExample: "ActiveRecord::Base.transaction do\n  user.save!\n  user.profile.update!(active: true)\nrescue ActiveRecord::RecordInvalid => e\n  Rails.logger.error e.record.errors.full_messages\n  raise\nend"
      }
    ]
  },
  {
    category: "Compilation",
    subcategories: [
      {
        subcategory: "Request Handling Error",
        suggestion: "Add explicit nil checks in middleware. Use `request.env` inspection to debug. Test middleware in isolation. Ensure middleware chain ordering is correct in application.rb. Add error boundaries",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# config/application.rb\nconfig.middleware.insert_before Rack::Head, CustomMiddleware\n# Add guards: return if request.path.nil?"
      },
      {
        subcategory: "Throttling Issue",
        suggestion: "Implement rate limiting with rack-attack gem. Set appropriate limits: 100/min for API, 5/min for auth. Add exponential backoff for retries. Monitor with New Relic/DataDog. Use Redis for distributed limiting",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# config/initializers/rack_attack.rb\nRack::Attack.throttle('req/ip', limit: 300, period: 5.minutes) do |req|\n  req.ip\nend"
      },
      {
        subcategory: "JSON Parsing Error",
        suggestion: "Validate JSON with schema (json-schema gem). Rescue JSON::ParserError explicitly. Log raw body for debugging. Use `JSON.parse(str, symbolize_names: true)` for consistency. Set proper Content-Type headers",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "begin\n  data = JSON.parse(request.body.read)\nrescue JSON::ParserError => e\n  Rails.logger.error \"Invalid JSON: #{request.body.string}\"\n  render json: { error: 'Invalid JSON' }, status: 400\nend"
      }
    ]
  },
  {
    category: "Performance",
    subcategories: [
      {
        subcategory: "High Memory Usage",
        suggestion: "Use `find_each` instead of `all` for large datasets. Profile with memory_profiler gem. Avoid loading associations unnecessarily. Use `pluck` instead of `map` for attributes. Enable jemalloc allocator",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# Bad: User.all.map(&:email)\n# Good: User.pluck(:email)\n# Large sets: User.find_each(batch_size: 1000) { |u| ... }"
      },
      {
        subcategory: "Long Query Duration",
        suggestion: "Add database indexes: `add_index :table, :column`. Use EXPLAIN ANALYZE to identify slow queries. Implement pagination with kaminari/pagy. Use eager loading (.includes). Consider materialized views for complex queries",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# Migration: add_index :orders, [:user_id, :created_at]\n# Query: Order.includes(:user, :items).where(user_id: id).page(1)"
      },
      {
        subcategory: "Slow View Rendering",
        suggestion: "Use Russian Doll caching with cache_key versioning. Fragment cache expensive partials. Move logic to decorators/presenters. Use `turbo_frame` for partial updates. Profile with rack-mini-profiler",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "<% cache @product do %>\n  <%= render @product %>\n<% end %>\n# Or: <%= cache_if condition, key do %>"
      }
    ]
  },
  {
    category: "Configuration",
    subcategories: [
      {
        subcategory: "Missing Environment Variable",
        suggestion: "Document all required ENV vars in .env.example. Use figaro/dotenv gem for management. Fail fast on boot with `fetch`: `ENV.fetch('API_KEY')`. Add validation in config/initializers",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# config/initializers/env_check.rb\nrequired_keys = %w[DATABASE_URL REDIS_URL API_KEY]\nmissing = required_keys.reject { |k| ENV[k].present? }\nraise \"Missing ENV: #{missing}\" if missing.any?"
      },
      {
        subcategory: "Improper Deployment Config",
        suggestion: "Use Rails credentials for secrets: `rails credentials:edit`. Separate config per environment (development/staging/production). Validate config on deploy with smoke tests. Use config gems like anyway_config",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# config/environments/production.rb\nconfig.force_ssl = true\nconfig.log_level = :info\n# RAILS_MASTER_KEY required for credentials"
      },
      {
        subcategory: "Dependency Mismatch",
        suggestion: "Run `bundle update gem_name` cautiously. Check CHANGELOG for breaking changes. Use `bundle audit` for security issues. Pin major versions: `gem 'rails', '~> 7.0.0'`. Test in staging before production deploy",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# Gemfile: gem 'devise', '~> 4.9'\n# Run: bundle install && bundle exec rspec\n# Check: git diff Gemfile.lock"
      }
    ]
  },
  {
    category: "Unknown",
    subcategories: [
      {
        subcategory: "Unknown Error",
        suggestion: "Enable verbose logging: `config.log_level = :debug`. Add exception tracking (Sentry/Rollbar). Check full stack trace with `binding.pry` or `debugger`. Review recent code changes in Git. Reproduce in development environment",
        slackthread: "https://browserstack.slack.com/archives/C01016S56ER/p1723106921992339",
        codeExample: "# Add to ApplicationController:\nrescue_from StandardError do |e|\n  Rails.logger.error e.full_message\n  Sentry.capture_exception(e)\n  render_500\nend"
      }
    ]
  }
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
2. Category - one of: ${ERROR_CATEGORIES.map(cat => cat.category).join(", ")}
3. Subcategory - must match one of the subcategories under the chosen category
4. Brief description of the issue
5. Potential impact
6. Suggested action - will be automatically matched from the subcategory

Log entry:
${error.content}

Respond ONLY with valid JSON format with keys: severity, category, subcategory, description, impact
IMPORTANT: Use ONLY the predefined categories and severity levels.`;

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
    const categoryNames = ERROR_CATEGORIES.map(cat => cat.category);
    if (!categoryNames.includes(category)) {
      // Try to find closest match
      const match = ERROR_CATEGORIES.find(
        (cat) =>
          category.toLowerCase().includes(cat.category.toLowerCase()) ||
          cat.category.toLowerCase().includes(category.toLowerCase())
      );
      category = match ? match.category : "Other";
    }

    // Find the category object
    const categoryObj = ERROR_CATEGORIES.find(cat => cat.category === category);
    
    // Validate and normalize subcategory
    let subcategory = analysis.subcategory || "Unknown Error";
    let suggestedAction = analysis.suggestedAction || "Manual investigation required";
    let slackThreadUrl = "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y";

    if (categoryObj) {
      const subcategoryNames = categoryObj.subcategories.map(sub => sub.subcategory);
      if (!subcategoryNames.includes(subcategory)) {
        // Try to find closest match
        const match = categoryObj.subcategories.find(
          (sub) =>
            subcategory.toLowerCase().includes(sub.subcategory.toLowerCase()) ||
            sub.subcategory.toLowerCase().includes(subcategory.toLowerCase())
        );
        if (match) {
          subcategory = match.subcategory;
          suggestedAction = match.suggestion;
          slackThreadUrl = match.slackthread || "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y";
        } else {
          // Use first subcategory as fallback
          subcategory = categoryObj.subcategories[0].subcategory;
          suggestedAction = categoryObj.subcategories[0].suggestion;
          slackThreadUrl = categoryObj.subcategories[0].slackthread || "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y";
        }
      } else {
        // Find the matching subcategory and use its suggestion
        const subcategoryObj = categoryObj.subcategories.find(sub => sub.subcategory === subcategory);
        if (subcategoryObj) {
          suggestedAction = subcategoryObj.suggestion;
          slackThreadUrl = subcategoryObj.slackthread || "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y";
        }
      }
    }

    return {
      ...error,
      analysis: {
        severity: severity,
        category: category,
        subcategory: subcategory,
        description: analysis.description || "No description available",
        impact: analysis.impact || "Unknown impact",
        suggestedAction: suggestedAction,
        slackThread: slackThreadUrl || "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y",
        relevantUrls: slackThreadUrl || "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y",
      },
    };
  } catch (err) {
    console.error(`❌ Error analyzing log entry: ${err.message}`);
    return {
      ...error,
      analysis: {
        severity: "UNKNOWN",
        category: "Other",
        subcategory: "Unknown Error",
        description: "AI analysis failed",
        impact: "Unable to determine",
        suggestedAction: "Manual investigation required",
        slackThread: "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y",
        relevantUrls: "https://browserstack.slack.com/archives/C02D3CWKF6Y/p1741085627615559?thread_ts=1741065769.408149&cid=C02D3CWKF6Y",
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
    console.log(`   Subcategory: ${error.analysis.subcategory || "N/A"}`);
    console.log(`   Timestamp: ${error.timestamp || "N/A"}`);
    console.log(`   Description: ${error.analysis.description}`);
    console.log(`   Impact: ${error.analysis.impact}`);
    console.log(`   Suggested Action: ${error.analysis.suggestedAction}`);
    console.log(`   Slack Thread: ${error.analysis.slackThread || error.analysis.relevantUrls || "N/A"}`);
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
  console.log(`   ${ERROR_CATEGORIES.map(cat => cat.category).join(", ")}`);
  console.log(`\n🔥 Severity Levels: ${SEVERITY_LEVELS.join(", ")}`);
  // console.log(
  //   `\n💡 Available Actions: ${SUGGESTED_ACTIONS.length} predefined actions\n`
  // );

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

// Run the main function only if called directly
if (require.main === module) {
  main();
}

// Export functions for use as a module
module.exports = {
  parseLogFile,
  analyzeErrors,
  generateReport,
  saveReport,
};
