// Utility function to get severity badge HTML
function getSeverityBadgeHTML(severity) {
  const severityMap = {
    Critical: "critical",
    High: "high",
    Medium: "medium",
    Low: "low",
  };
  const className = severityMap[severity] || "low";
  return `<span class="badge badge-${className}">${severity}</span>`;
}

// Utility function to get category icon/label
function getCategoryLabel(category) {
  const categoryLabels = {
    Database: "Database",
    CSS: "CSS",
    Memory: "Memory",
    API: "API",
    Runtime: "Runtime",
    Connection: "Connection",
    Authentication: "Authentication",
    Performance: "Performance",
  };
  return categoryLabels[category] || category;
}

// Utility function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Utility function to copy to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Copied to clipboard!");
    })
    .catch(() => {
      alert("Failed to copy to clipboard");
    });
}
