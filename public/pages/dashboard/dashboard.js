// Initialize app when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Initialize listeners and placeholder state
  setupFilterListener();
  setupAnalysisButton();
  setupEnvironmentSelector();
  showPreAnalysisPlaceholder();
});

const API_URL = "/api/errors";
let errors = [];
let loadedErrors = [];
let hasLoadedErrors = false; // track if analysis has been run
let expandedRowId = null; // currently expanded error id
let filteredErrorsView = []; // errors after applying active filters

// Fetch errors from API
async function fetchErrors() {
  setStatus("Loading errors...");
  try {
    // Get current environment selection
    const envSelector = document.getElementById("env-selector");
    const selectedEnv = envSelector ? envSelector.value : "devos2";
    
    // Build URL with env_name query parameter
    const url = new URL(API_URL, window.location.origin);
    url.searchParams.append("env_name", selectedEnv);
    
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Failed to load errors");
    const data = await res.json();
    return data.errors || [];
  } catch (err) {
    console.error(err);
    setStatus("Failed to load errors");
    return [];
  }
}

// Transform API data to dashboard format
function transformErrorData(apiErrors) {
  return apiErrors.map((apiError, index) => {
    return {
      id: index + 1,
      title: apiError.title || "Unknown Error",
      category: apiError.category || "Other",
      severity: mapSeverityLevel(apiError.severity) || "Medium",
      errorCode: apiError.id || `ERR_${String(index + 1).padStart(3, "0")}`,
      timestamp:
        formatTimestamp(apiError.timestamp) || new Date().toLocaleString(),
      stackTrace: formatStackTrace(apiError.content, apiError.description),
      description: apiError.description,
      solution: apiError.recommendation || "No solution available",
      fixSteps: generateFixSteps(apiError.recommendation),
      slackThread: apiError.slackThreadSuggestion || null,
      impact: apiError.impact || "Unknown impact",
      lineNumber: apiError.lineNumber || 0,
    };
  });
}

// Map severity levels from API format to UI format
function mapSeverityLevel(apiSeverity) {
  const severityMapping = {
    CRITICAL: "Critical",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
    UNKNOWN: "Medium", // Default unknown to medium
  };
  return severityMapping[apiSeverity] || "Medium";
}

// Format timestamp from API
function formatTimestamp(timestamp) {
  if (!timestamp) return new Date().toLocaleString();

  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return timestamp; // Return as-is if parsing fails
  }
}

// Format stack trace from content and description
function formatStackTrace(content, description) {
  let stackTrace = `Description: ${description}\n\n`;

  try {
    const parsed = JSON.parse(content);
    if (parsed.log && parsed.log.dynamic_data) {
      stackTrace += `Stack Trace:\n${parsed.log.dynamic_data}`;
    } else if (parsed.log && parsed.log.kind) {
      stackTrace += `Log Kind: ${parsed.log.kind}\n`;
      if (parsed.data) {
        stackTrace += `Request Data: ${JSON.stringify(parsed.data, null, 2)}`;
      }
    } else {
      stackTrace += `Raw Content:\n${content}`;
    }
  } catch (e) {
    // If JSON parsing fails, include raw content
    stackTrace += `Raw Content:\n${content}`;
  }

  return stackTrace;
}

// Generate fix steps from recommendation
function generateFixSteps(recommendation) {
  if (!recommendation) return ["Investigate the issue manually"];

  // const steps = recommendation
  //   .split(".")
  //   .filter((step) => step.trim().length > 0);
  // return steps.length > 0 ? steps.map((step) => step.trim()) : [recommendation];
  return [recommendation];
}

// Set status message
function setStatus(msg) {
  console.log("Status:", msg);
  // You could add a status element to the HTML if needed
}

// Load errors from API and render them
async function loadAndRenderErrors() {
  const apiErrors = await fetchErrors();
  errors = transformErrorData(apiErrors);
  loadedErrors = [...errors];
  hasLoadedErrors = true;
  applyFilters();
  // Reveal summary section on first successful load
  const summarySection = document.getElementById('summary-section');
  if (summarySection) summarySection.classList.remove('hidden');
}

// Render all error cards
function renderErrorTable(data) {
  const tbody = document.getElementById("error-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr class="placeholder-row"><td colspan="5">No errors found for current selection</td></tr>';
    updateErrorCount(0);
    return;
  }

  data.forEach((error) => {
    const tr = document.createElement("tr");
    tr.className = "error-row";
    tr.dataset.errorId = error.id;
    tr.innerHTML = `
      <td class="cell-index">${error.id}</td>
      <td class="cell-severity">
        <span class="severity-badge severity-${error.severity.toLowerCase()}">${error.severity}</span>
      </td>
      <td class="cell-category">${error.category}</td>
      <td class="cell-description">${escapeHtmlShort(error.description)}</td>
      <td class="cell-slack">${renderSlackCell(error)}</td>
    `;

    tr.addEventListener("click", () => toggleRowExpansion(error));
    tbody.appendChild(tr);

    // Insert expansion row if currently expanded
    if (expandedRowId === error.id) {
      insertExpansionRow(error, tbody);
    }
  });

  updateErrorCount(data.length);
}

// Create individual error card element
// Insert an expansion row beneath the clicked row
function insertExpansionRow(error, tbody) {
  console.log("Inserting expansion row for error:", error);
  const expansion = document.createElement("tr");
  expansion.className = "expansion-row";
  expansion.dataset.expansionFor = error.id;
  const actionsList = error.fixSteps
    .map((step) => `<li>${escapeAttr(step)}</li>`) // numbered
    .join("");
  expansion.innerHTML = `
    <td colspan="5">
      <div class="expansion-wrapper">
        <div class="expansion-header">
          <div class="exp-metrics">
            <span class="exp-badge severity-${error.severity.toLowerCase()}"></span>
            <span class="exp-badge"></span>
            <span class="exp-badge"></span>
          </div>
          <button class="close-expansion" aria-label="Collapse details">×</button>
        </div>
        <div class="expansion-section">
          <h4>Impact Area</h4>
          <p>${escapeAttr(error.impact)}</p>
        </div>
        <div class="expansion-section">
          <h4>Recommendations</h4>
          <ol class="actions-list">${actionsList}</ol>
        </div>
        <div class="expansion-section">
          <h4>Log Trace</h4>
          <pre class="exp-stack">${escapeAttr(error.stackTrace)}</pre>
        </div>
        <div class="expansion-footer">
          ${renderSlackInfo(error)}
        </div>
      </div>
    </td>
  `;
  const closeBtn = expansion.querySelector(".close-expansion");
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    expandedRowId = null;
    renderErrorTable(filteredErrorsView);
  });
  tbody.appendChild(expansion);
  // After inserting, adjust height
  adjustExpansionHeight();
}

function renderSlackInfo(error) {
  if (error.slackThread) {
    return `<a class="slack-thread-link" href="${error.slackThread}" target="_blank" rel="noopener noreferrer">Slack Thread</a>`;
  }
  return '<span class="slack-thread-missing">No Slack thread</span>';
}

function renderSlackCell(error) {
  if (error.slackThread) {
    return `<a class="slack-link-inline" href="${error.slackThread}" target="_blank" rel="noopener noreferrer" title="Open Slack thread">Link</a>`;
  }
  return '<span class="slack-missing-inline" title="No Slack thread yet">—</span>';
}

function toggleRowExpansion(error) {
  if (expandedRowId === error.id) {
    expandedRowId = null; // collapse
  } else {
    expandedRowId = error.id; // expand new one
  }
  renderErrorTable(filteredErrorsView);
  // height recalculated in insertExpansionRow
}

// Escape for short inline text (truncate if very long)
function escapeHtmlShort(str) {
  if (!str) return "";
  const cleaned = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return cleaned.length > 180 ? cleaned.slice(0, 177) + "…" : cleaned;
}

function escapeAttr(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Setup filter dropdown listener
function setupFilterListener() {
  const categorySelect = document.getElementById("category-filter");
  const severitySelect = document.getElementById("severity-filter");

  if (categorySelect) {
    categorySelect.addEventListener("change", applyFilters);
  }

  if (severitySelect) {
    severitySelect.addEventListener("change", applyFilters);
  }
}

// Apply category and severity filters to the error list
function applyFilters() {
  const categorySelect = document.getElementById("category-filter");
  const severitySelect = document.getElementById("severity-filter");
  const selectedCategory = categorySelect ? categorySelect.value : "all";
  const selectedSeverity = severitySelect ? severitySelect.value : "all";

  filteredErrorsView = errors.filter((error) => {
    const categoryMatches =
      selectedCategory === "all" || error.category === selectedCategory;
    const normalizedSeverity = error.severity
      ? error.severity.toLowerCase()
      : "";
    const severityMatches =
      selectedSeverity === "all" || normalizedSeverity === selectedSeverity;
    return categoryMatches && severityMatches;
  });

  expandedRowId = null; // reset expansion when filtering
  renderSummary(filteredErrorsView);
  renderErrorTable(filteredErrorsView);
}

// Update error count display
function updateErrorCount(count) {
  const errorCount = document.getElementById("error-count");
  errorCount.textContent = `${count} ${count === 1 ? "error" : "errors"}`;
}

// Modal handlers removed - replaced with inline expansion rows

// Open error modal with details
// Removed openErrorModal

// Close error modal
// Removed closeErrorModal

// Copy Slack thread link
function copySlackLink(error) {
  if (error && error.slackThread) {
    navigator.clipboard.writeText(error.slackThread);
    alert("Slack thread link copied to clipboard!");
  } else {
    alert("No Slack thread available for this error yet.");
  }
}

// Send notification to Slack
function notifySlack(error) {
  if (error) {
    alert(`Sending "${error.title}" to Slack...`);
    // Implement API call here in future
  }
}

function setupAnalysisButton() {
  const analysisBtn = document.getElementById("run-analysis-btn");

  analysisBtn.addEventListener("click", () => {
    runAIAnalysis();
  });
}

function runAIAnalysis() {
  const btn = document.getElementById("run-analysis-btn");
  const originalText = btn.innerHTML;

  // Prevent double-trigger while already analyzing
  if (btn.disabled) return;

  // Show loading state
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span>Analyzing...';

  // Reload data from API after analysis delay
  setTimeout(async () => {
    await loadAndRenderErrors();
    btn.disabled = false;
    // After first run, keep original button text or change to Re-run Analysis
    if (!hasLoadedErrors) {
      btn.innerHTML = originalText;
    } else {
      btn.innerHTML = '<span class="btn-icon">🔄</span>Re-run AI Analysis';
    }

    // Reset filter to show all errors
    const categoryFilter = document.getElementById("category-filter");
    if (categoryFilter) categoryFilter.value = "all";
    const severityFilter = document.getElementById("severity-filter");
    if (severityFilter) severityFilter.value = "all";
    applyFilters();

    // Show success message
    // alert("AI Analysis complete! Logs updated and ready for review.");
  }, 2000);
}

function setupEnvironmentSelector() {
  const envSelector = document.getElementById("env-selector");

  envSelector.addEventListener("change", async (e) => {
    const selectedEnv = e.target.value;
    console.log("Environment changed to:", selectedEnv);

    if (hasLoadedErrors) {
      // Only reload if analysis has already been run
      setStatus(`Loading errors for ${selectedEnv} environment...`);
      await loadAndRenderErrors();
    } else {
      setStatus("Run AI Analysis to load errors for the selected environment.");
    }

    // alert(`Environment switched to: ${selectedEnv.toUpperCase()}`);
  });
}

// Show placeholder content before first analysis run
function showPreAnalysisPlaceholder() {
  const tbody = document.getElementById("error-table-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr class="placeholder-row"><td colspan="5">No analysis run yet. Click <strong>Run AI Analysis</strong> to generate insights.</td></tr>`;
  updateErrorCount(0);
  // Keep summary hidden before first run
}

// ---------------- Summary & Charts -----------------

function computeSummary(data) {
  const summary = {
    total: data.length,
    severity: {},
    categories: {},
  };
  data.forEach((e) => {
    summary.severity[e.severity] = (summary.severity[e.severity] || 0) + 1;
    summary.categories[e.category] = (summary.categories[e.category] || 0) + 1;
  });
  return summary;
}

function renderSummary(data) {
  const summaryEl = document.getElementById("summary-metrics");
  const totalEl = document.getElementById("summary-total");
  if (!summaryEl || !totalEl) return;
  const summary = computeSummary(data);
  totalEl.textContent = `Total Errors: ${summary.total}`;

  // Severity chips
  const severityParts = Object.entries(summary.severity)
    .sort((a, b) => b[1] - a[1])
    .map(([sev, count]) => `<span class="metric-chip sev-${sev.toLowerCase()}">${sev}: ${count}</span>`) // severity chip
    .join(" ");

  // Category list (top 6)
  const categoriesSorted = Object.entries(summary.categories).sort((a, b) => b[1] - a[1]);
  const catParts = categoriesSorted
    .slice(0, 6)
    .map(([cat, count]) => `<span class="metric-chip">${cat}: ${count}</span>`) // category chip
    .join(" ");
  const moreCount = categoriesSorted.length - 6;
  const moreHtml = moreCount > 0 ? `<span class="metric-chip more">+${moreCount} more</span>` : "";

  summaryEl.innerHTML = `
    <div class="summary-row">
      <div class="summary-block">
        <h3 class="summary-subtitle">Severity</h3>
        <div class="chips-row">${severityParts || '<span class="metric-empty">No data</span>'}</div>
      </div>
      <div class="summary-block">
        <h3 class="summary-subtitle">Error Types</h3>
        <div class="chips-row">${catParts || '<span class="metric-empty">No data</span>'} ${moreHtml}</div>
      </div>
    </div>
  `;
  // Chart rendering removed per new UI requirements
}

// Provide Slack cell content with truncated display
function renderSlackCell(error) {
  if (error.slackThread) {
    const display = truncateMiddle(error.slackThread, 40);
    return `<span class="slack-thread-text" title="Slack thread"><a class="slack-link-inline" href="${error.slackThread}" target="_blank" rel="noopener noreferrer">Slack Thread</a></span>`;
  }
  return '<span class="slack-missing-inline" title="No Slack thread yet">No thread</span>';
}

function truncateMiddle(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  const half = Math.floor((maxLength - 3) / 2);
  return str.slice(0, half) + '...' + str.slice(-half);
}

// Dynamically adjust expansion wrapper height to prevent overflow
function adjustExpansionHeight() {
  const wrapper = document.querySelector('.expansion-wrapper');
  if (!wrapper) return;
  const viewportHeight = window.innerHeight;
  const rect = wrapper.getBoundingClientRect();
  const available = viewportHeight - rect.top - 40; // bottom padding
  const max = Math.min(available, viewportHeight * 0.7); // cap at 70vh
  wrapper.style.maxHeight = `${Math.max(240, max)}px`; // at least 240px
}

window.addEventListener('resize', () => {
  adjustExpansionHeight();
});
