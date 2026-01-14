// DevTab Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const usernameInput = document.getElementById('username');
  const themeSelect = document.getElementById('theme');
  const statusDiv = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get(['githubUsername', 'graphTheme'], (result) => {
    if (result.githubUsername) {
      usernameInput.value = result.githubUsername;
    }
    if (result.graphTheme) {
      themeSelect.value = result.graphTheme;
    }
  });

  // Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const theme = themeSelect.value;

    if (!username) {
      showStatus('Please enter a GitHub username', 'error');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(username)) {
      showStatus('Invalid GitHub username format', 'error');
      return;
    }

    chrome.storage.sync.set({
      githubUsername: username,
      graphTheme: theme
    }, () => {
      showStatus('Settings saved! Open a new tab to see changes.', 'success');
    });
  });

  // Open new tab
  document.getElementById('open-newtab').addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://newtab' });
  });

  // Reset all settings
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Reset all DevTab settings to defaults?')) {
      chrome.storage.sync.clear(() => {
        usernameInput.value = '';
        themeSelect.value = 'github';
        showStatus('All settings have been reset', 'success');
      });
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    setTimeout(() => {
      statusDiv.className = 'status';
    }, 3000);
  }
});
