const dummyErrors = [
  {
    id: 1,
    title: "Database Connection Timeout",
    category: "Database",
    severity: "Critical",
    errorCode: "DB_TIMEOUT_001",
    timestamp: "2024-10-31 14:23:45",
    stackTrace: `at connectToDatabase (db.js:45:12)
    at async initializeApp (app.js:12:8)
    at async main (server.js:5:3)
    Error: Connection timeout after 30000ms
    Database: PostgreSQL (localhost:5432)`,
    solution:
      "The database connection is timing out. This typically occurs when the database server is unreachable or overloaded. Check if PostgreSQL is running, verify network connectivity, and increase the connection timeout if necessary.",
    fixSteps: [
      "Verify PostgreSQL service is running: systemctl status postgresql",
      "Check database credentials in .env file",
      "Increase connection timeout: setTimeout = 60000",
      "Check network connectivity to database host",
      "Review database logs for any issues",
      "Restart the application",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635696225000100",
  },
  {
    id: 2,
    title: "CSS Flexbox Layout Misalignment",
    category: "CSS",
    severity: "Medium",
    errorCode: "CSS_FLEX_002",
    timestamp: "2024-10-31 13:55:12",
    stackTrace: `at renderComponent (components/navbar.js:34:8)
    at async renderPage (app.js:67:3)
    Layout properties missing: align-items, justify-content
    Affected elements: .navbar-container, .nav-items`,
    solution:
      "The CSS flexbox properties are not properly configured, causing alignment issues. The navbar items are not centered vertically because align-items and justify-content are missing from the flex container.",
    fixSteps: [
      "Add 'display: flex' to .navbar-container",
      "Add 'align-items: center' for vertical alignment",
      "Add 'justify-content: space-between' for horizontal spacing",
      "Set 'flex-wrap: wrap' for responsive design",
      "Test on different screen sizes",
      "Use browser DevTools to verify layout",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635695412000100",
  },
  {
    id: 3,
    title: "Memory Leak - Event Listeners Not Cleaned",
    category: "Memory",
    severity: "High",
    errorCode: "MEM_LEAK_003",
    timestamp: "2024-10-31 13:22:33",
    stackTrace: `at addEventListener (utils.js:89:5)
    at async setupEventListeners (app.js:45:2)
    Memory growth: 150MB/min
    Event listeners accumulated: 2,453 active listeners
    Node memory: 512MB of 1024MB available`,
    solution:
      "Event listeners are being added without being removed when components are unmounted. This causes memory to continuously grow and eventually crash the application. Implement proper cleanup functions.",
    fixSteps: [
      "Add removeEventListener in component cleanup",
      "Use WeakMap for event tracking",
      "Implement AbortController for event cleanup",
      "Monitor memory usage in DevTools",
      "Clear intervals and timeouts on unmount",
      "Test with Chrome DevTools Memory profiler",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635694933000100",
  },
  {
    id: 4,
    title: "API Rate Limit Exceeded",
    category: "API",
    severity: "High",
    errorCode: "API_RATE_004",
    timestamp: "2024-10-31 12:45:20",
    stackTrace: `at fetchUserData (api.js:156:8)
    at async loadDashboard (dashboard.js:34:5)
    HTTP Status: 429 Too Many Requests
    Rate limit: 100 requests/min
    Requests made: 342 in the last minute`,
    solution:
      "Your API calls are exceeding the rate limit. The service allows 100 requests per minute, but 342 requests were made. Implement request throttling and caching to reduce redundant API calls.",
    fixSteps: [
      "Implement request caching with 5-minute TTL",
      "Use debounce for user input-triggered requests",
      "Batch API requests where possible",
      "Implement exponential backoff for retries",
      "Monitor API call frequency in logs",
      "Consider upgrading API plan for higher limits",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635694720000100",
  },
  {
    id: 5,
    title: "Runtime Error - Undefined Variable Reference",
    category: "Runtime",
    severity: "Critical",
    errorCode: "RUNTIME_005",
    timestamp: "2024-10-31 12:12:00",
    stackTrace: `TypeError: Cannot read property 'name' of undefined
    at getUserName (user.js:23:5)
    at async fetchProfile (api.js:89:3)
    Variable 'userData' is undefined
    Expected object, received: undefined`,
    solution:
      "The code is trying to access a property on an undefined variable. This happens when the data hasn't been fetched or initialized before being used. Add null checks and proper data validation.",
    fixSteps: [
      "Add null/undefined check before accessing properties",
      "Initialize variables with default values",
      "Use optional chaining: userData?.name",
      "Add error boundaries in React components",
      "Test with missing data scenarios",
      "Use TypeScript for type safety",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635694320000100",
  },
  {
    id: 6,
    title: "Connection Reset - Network Interrupted",
    category: "Connection",
    severity: "High",
    errorCode: "CONN_RESET_006",
    timestamp: "2024-10-31 11:33:45",
    stackTrace: `at TLSSocket.onclose (net.js:567:8)
    Error: socket hang up
    Connection closed unexpectedly
    Duration: 2.3 seconds before disconnect
    Remote address: 192.168.1.100:3306`,
    solution:
      "The network connection was unexpectedly closed by the server or network infrastructure. This can happen due to timeouts, server crashes, or network issues. Implement connection pooling and retry logic.",
    fixSteps: [
      "Increase socket timeout to 30 seconds",
      "Implement automatic reconnection logic",
      "Use connection pooling for database",
      "Check server logs for crash reasons",
      "Monitor network stability",
      "Add circuit breaker pattern for resilience",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635693825000100",
  },
  {
    id: 7,
    title: "Authentication Token Expired",
    category: "Authentication",
    severity: "Medium",
    errorCode: "AUTH_TOKEN_007",
    timestamp: "2024-10-31 10:55:22",
    stackTrace: `at verifyToken (auth.js:45:8)
    at async authenticateRequest (middleware.js:12:3)
    JWT token expired at: 1635607200000
    Current timestamp: 1635610800000
    Expiration: 1 hour`,
    solution:
      "The JWT authentication token has expired and needs to be refreshed. Users need to re-authenticate or the token should be automatically refreshed before expiration.",
    fixSteps: [
      "Implement token refresh endpoint",
      "Check token expiration before API calls",
      "Refresh token automatically before expiry",
      "Store refresh token securely",
      "Redirect to login on token expiration",
      "Implement sliding window for token renewal",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635690922000100",
  },
  {
    id: 8,
    title: "Performance Issue - Slow Database Query",
    category: "Performance",
    severity: "Medium",
    errorCode: "PERF_SLOW_008",
    timestamp: "2024-10-31 10:15:00",
    stackTrace: `at executeLargeQuery (queries.js:234:12)
    Query: SELECT * FROM users JOIN orders JOIN products...
    Execution time: 8.3 seconds
    Rows scanned: 1,200,000
    Missing index on: orders.user_id`,
    solution:
      "Database query is taking too long to execute. The query is scanning 1.2 million rows without proper indexing. This severely impacts application performance and user experience.",
    fixSteps: [
      "Add database index on orders.user_id",
      "Use EXPLAIN ANALYZE to check query plan",
      "Limit result set with pagination",
      "Use SELECT specific columns, not *",
      "Archive old data to separate table",
      "Implement query caching",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635689700000100",
  },
  {
    id: 9,
    title: "Parse Error - Unexpected Character",
    category: "parse",
    severity: "Critical",
    errorCode: "PARSE_ERR_009",
    timestamp: "2024-10-31 09:45:00",
    stackTrace: `SyntaxError: Unexpected token '<'
    at parseCode (parser.js:23:8)
    at async compileModule (compiler.js:12:3)
    File: module.js
    Line: 10`,
    solution:
      "A parse error occurred due to an unexpected character '<' in the code. This could be due to incorrect HTML or XML embedded in JavaScript files. Ensure that all code is properly formatted and does not contain unexpected characters.",
    fixSteps: [
      "Check for HTML/XML tags in JavaScript files",
      "Validate code syntax using linters",
      "Escape special characters in strings",
      "Use template literals for complex strings",
      "Review file encoding and line endings",
      "Consult documentation for correct syntax",
    ],
    slackThread: "https://workspace.slack.com/archives/C123456789/p1635688500000100",
  },
]

window.errors = dummyErrors
