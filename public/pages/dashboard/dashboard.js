// Initialize app when page loads
document.addEventListener("DOMContentLoaded", () => {
  renderAllErrors();
  setupFilterListener();
  setupModalHandlers();
  setupAnalysisButton();
  setupEnvironmentSelector(); // Add environment selector listener
});

const errors = window.errors || [];

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
    </div>
    <div class="card-footer">
      <span class="card-footer-item">${error.timestamp}</span>
    </div>
  `;

  card.addEventListener("click", () => {
    openErrorModal(error);
  });

  return card;
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

  // Show loading state
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⏳</span>Analyzing...';

  // Simulate analysis delay (2 seconds)
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = originalText;

    // Reset filter to show all errors
    document.getElementById("category-filter").value = "all";
    renderAllErrors();

    // Show success message
    alert("AI Analysis complete! Logs updated and ready for review.");
  }, 2000);
}

function setupEnvironmentSelector() {
  const envSelector = document.getElementById("env-selector");

  envSelector.addEventListener("change", (e) => {
    const selectedEnv = e.target.value;
    console.log("[v0] Environment changed to:", selectedEnv);
    // In production, this would fetch logs for the selected environment
    alert(`Environment switched to: ${selectedEnv.toUpperCase()}`);
  });
}
