// helpers/errors.js
// Centralised error definitions and accessor helpers.

const errors = [
  {
    id: 'network_connection_lost',
    title: 'Network Connection Lost',
    description: 'The application was unable to connect to the server. This may be due to poor internet connectivity or a temporary server issue.',
    recommendation: 'Check your internet connection and try again. If the issue persists, contact support.',
    slackThreadSuggestion: {
      label: 'Infra outages (2025-10-12)',
      url: 'https://slack.example.com/archives/infra-outages/p123456789'
    }
  },
  {
    id: 'invalid_login_credentials',
    title: 'Invalid Login Credentials',
    description: 'The username or password entered does not match our records.',
    recommendation: 'Ensure you are using the correct credentials or reset your password if you\'ve forgotten it.',
    slackThreadSuggestion: {
      label: 'Auth support pinned reset guide',
      url: 'https://slack.example.com/archives/auth-support/p234567890'
    }
  },
  {
    id: 'file_upload_failed',
    title: 'File Upload Failed',
    description: 'The selected file could not be uploaded due to size restrictions or unsupported format.',
    recommendation: 'Try uploading a smaller file or convert it to a supported format (e.g., .jpg, .png, .pdf).',
    slackThreadSuggestion: {
      label: 'File ops size limits discussion',
      url: 'https://slack.example.com/archives/file-ops/p345678901'
    }
  },
  {
    id: 'unauthorized_access',
    title: 'Unauthorized Access',
    description: 'You do not have permission to view this resource.',
    recommendation: 'Log in with an account that has the necessary permissions or contact your administrator.',
    slackThreadSuggestion: {
      label: 'RBAC updates summary',
      url: 'https://slack.example.com/archives/rbac-updates/p456789012'
    }
  },
  {
    id: 'data_sync_error',
    title: 'Data Sync Error',
    description: 'Some records failed to sync with the server due to validation issues.',
    recommendation: 'Review your data for missing or incorrect fields, then retry synchronisation.',
    slackThreadSuggestion: {
      label: 'Sync pipeline partial failure strategies',
      url: 'https://slack.example.com/archives/sync-pipeline/p567890123'
    }
  }
];

function getAllErrors() {
  return errors;
}

function getErrorById(id) {
  return errors.find(e => e.id === id) || null;
}

module.exports = {
  getAllErrors,
  getErrorById,
};
