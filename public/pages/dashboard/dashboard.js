// Initialize app when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Do NOT auto-fetch errors; user must click Run AI Analysis
  setupFilterListener();
  setupModalHandlers();
  setupAnalysisButton();
  setupEnvironmentSelector(); // Add environment selector listener
  showPreAnalysisPlaceholder();
});

const API_URL = "/api/errors";
let errors = [];
let loadedErrors = [];
let hasLoadedErrors = false; // track if analysis has been run

// Fetch errors from API
async function fetchErrors() {
  setStatus("Loading errors...");
  try {
    const res = await fetch(API_URL, {
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
      solution: apiError.recommendation || "No solution available",
      fixSteps: generateFixSteps(apiError.recommendation),
      slackThread: apiError.slackThreadSuggestion?.url || null,
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

  const steps = recommendation
    .split(".")
    .filter((step) => step.trim().length > 0);
  return steps.length > 0 ? steps.map((step) => step.trim()) : [recommendation];
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
  renderAllErrors();
  hasLoadedErrors = true;
}

// Render all error cards
function renderAllErrors() {
  const logsList = document.getElementById("logs-list");
  logsList.innerHTML = "";

  errors.forEach((error) => {
    const errorCard = createErrorCard(error);
    logsList.appendChild(errorCard);
  });

  updateErrorCount(errors.length);
}

// Create individual error card element
function createErrorCard(error) {
  const card = document.createElement("div");
  card.className = "error-card";
  card.dataset.category = error.category;
  card.dataset.errorId = error.id;
  card.style.borderLeftColor = getSeverityColor(error.severity);

  function getSeverityColor(severity) {
    const colors = {
      Critical: "#dc2626",
      High: "#ea580c",
      Medium: "#f59e0b",
      Low: "#10b981",
    };
    return colors[severity] || "#6b7280";
  }

  const slackHtml = error.slackThread
    ? `<a class="slack-thread-link" href="${error.slackThread}" target="_blank" rel="noopener noreferrer">Slack Thread</a>`
    : '<span class="slack-thread-missing">No Slack thread</span>';

  card.innerHTML = `
    <div class="card-main">
      <div class="card-header">
        <h3 class="card-title">${error.title}</h3>
        <span class="severity-badge severity-${error.severity.toLowerCase()}">${
    error.severity
  }</span>
      </div>
      <div class="card-meta">
        <div class="card-meta-item">
          <span class="card-meta-label">Category:</span>
          <span class="card-meta-value">${error.category}</span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-label">Code:</span>
          <span class="card-meta-value">${error.errorCode}</span>
        </div>
      </div>
      <div class="card-recommendation">
        <span class="rec-label">Recommendation:</span>
        <span class="rec-text">${escapeHtmlShort(error.solution)}</span>
      </div>
      <div class="card-slack">
        ${slackHtml}
      </div>
    </div>
    <div class="card-footer">
      <span class="card-footer-item">${error.timestamp}</span>
      <button class="btn btn-small view-details-btn" type="button" aria-label="View details for ${escapeAttr(
        error.title
      )}">Details</button>
    </div>
  `;

  // Attach listener only to button
  const detailsBtn = card.querySelector(".view-details-btn");
  detailsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openErrorModal(error);
  });

  return card;
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
  const filterSelect = document.getElementById("category-filter");

  filterSelect.addEventListener("change", (e) => {
    const selectedCategory = e.target.value;
    filterErrors(selectedCategory);
  });
}

// Filter errors by category
function filterErrors(category) {
  const logsList = document.getElementById("logs-list");
  logsList.innerHTML = "";

  const filteredErrors =
    category === "all"
      ? errors
      : errors.filter((error) => error.category === category);

  if (filteredErrors.length === 0) {
    logsList.innerHTML =
      '<div class="no-results">No errors found in this category</div>';
    updateErrorCount(0);
    return;
  }

  filteredErrors.forEach((error) => {
    const errorCard = createErrorCard(error);
    logsList.appendChild(errorCard);
  });

  updateErrorCount(filteredErrors.length);
}

// Update error count display
function updateErrorCount(count) {
  const errorCount = document.getElementById("error-count");
  errorCount.textContent = `${count} ${count === 1 ? "error" : "errors"}`;
}

function setupModalHandlers() {
  const modal = document.getElementById("error-modal");
  const backdrop = document.getElementById("modal-backdrop");
  const closeBtn = document.getElementById("modal-close");
  const cancelBtn = document.getElementById("modal-cancel");

  // Close modal on close button click
  closeBtn.addEventListener("click", () => {
    closeErrorModal();
  });

  // Close modal on cancel button click
  cancelBtn.addEventListener("click", () => {
    closeErrorModal();
  });

  // Close modal on backdrop click
  backdrop.addEventListener("click", () => {
    closeErrorModal();
  });

  // Prevent modal close when clicking inside modal content
  modal.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Setup button actions
  document
    .getElementById("copy-slack-btn")
    .addEventListener("click", copySlackLink);
  document
    .getElementById("notify-slack-btn")
    .addEventListener("click", notifySlack);
}

// Open error modal with details
function openErrorModal(error) {
  const modal = document.getElementById("error-modal");
  const backdrop = document.getElementById("modal-backdrop");

  // Populate modal with error data
  document.getElementById("modal-title").textContent = error.title;
  document.getElementById("modal-category").textContent = error.category;
  document.getElementById("modal-severity").textContent = error.severity;
  document.getElementById("modal-timestamp").textContent = error.timestamp;
  document.getElementById("modal-error-code").textContent = error.errorCode;

  // Stack trace
  document.getElementById("modal-stack-trace").textContent = error.stackTrace;

  // AI solution
  document.getElementById("modal-solution").textContent = error.solution;

  // Fix steps
  const fixStepsHtml = error.fixSteps
    .map((step) => `<li>${step}</li>`)
    .join("");
  document.getElementById("modal-fix-steps").innerHTML = fixStepsHtml;

  // Slack info
  document.getElementById("modal-slack-info").textContent = `Slack Thread: ${
    error.slackThread ? error.slackThread : "Not yet posted to Slack"
  }`;

  // Store current error ID for Slack actions
  modal.dataset.currentErrorId = error.id;

  // Show modal and backdrop
  backdrop.classList.add("active");
  modal.showModal();
}

// Close error modal
function closeErrorModal() {
  const modal = document.getElementById("error-modal");
  const backdrop = document.getElementById("modal-backdrop");

  backdrop.classList.remove("active");
  modal.close();
}

// Copy Slack thread link
function copySlackLink() {
  const modal = document.getElementById("error-modal");
  const errorId = modal.dataset.currentErrorId;
  const error = errors.find((e) => e.id === Number.parseInt(errorId));

  if (error && error.slackThread) {
    navigator.clipboard.writeText(error.slackThread);
    alert("Slack thread link copied to clipboard!");
  } else {
    alert("No Slack thread available for this error yet.");
  }
}

// Send notification to Slack
function notifySlack() {
  const modal = document.getElementById("error-modal");
  const errorId = modal.dataset.currentErrorId;
  const error = errors.find((e) => e.id === Number.parseInt(errorId));

  if (error) {
    alert(`Sending "${error.title}" to Slack...`);
    // In production, this would call an API endpoint to post to Slack
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
    document.getElementById("category-filter").value = "all";
    renderAllErrors();

    // Show success message
    alert("AI Analysis complete! Logs updated and ready for review.");
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

    alert(`Environment switched to: ${selectedEnv.toUpperCase()}`);
  });
}

// Show placeholder content before first analysis run
function showPreAnalysisPlaceholder() {
  const logsList = document.getElementById("logs-list");
  if (!logsList) return;
  logsList.innerHTML = `<div class="pre-analysis-placeholder">
    <p>No analysis run yet.</p>
    <p>Click <strong>Run AI Analysis</strong> to generate the latest error insights.</p>
  </div>`;
  updateErrorCount(0);
}
