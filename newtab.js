/**
 * DevTab - GitHub Contributions New Tab Extension
 * A beautiful, techy dashboard for developers
 */

// ============================================
// Configuration & Defaults
// ============================================

const DEFAULT_CONFIG = {
  githubUsername: '',
  graphTheme: 'github',
  fontFamily: 'JetBrains Mono',
  clockFormat: '24',
  showSeconds: true,
  bgUrl: '',
  bgBlur: 8,
  bgBrightness: 40,
  focusDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  searchEngine: 'google',
  // Branding
  brandName: 'DevTab',
  // Pomodoro sounds
  pomodoroSounds: true,
  // Theme: 'dark', 'light', or 'system'
  theme: 'dark',
  // Visibility toggles
  showPomodoro: true,
  showQuickLinks: true,
  quickLinks: [
    { name: 'GitHub', url: 'https://github.com', icon: '' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '' },
    { name: 'Reddit', url: 'https://reddit.com/r/programming', icon: '' },
    { name: 'Hacker News', url: 'https://news.ycombinator.com', icon: '' },
    { name: 'Dev.to', url: 'https://dev.to', icon: '' }
  ]
};

const SEARCH_ENGINES = {
  google: 'https://www.google.com/search?q=',
  claude: 'https://claude.ai/new?q=',
  chatgpt: 'https://chatgpt.com/?q=',
  stackoverflow: 'https://stackoverflow.com/search?q='
};

// ============================================
// State
// ============================================

let config = { ...DEFAULT_CONFIG };
let pomodoroState = {
  mode: 'focus',
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isRunning: false,
  interval: null,
  sessions: 0
};
let editingLinkIndex = null;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Set favicon dynamically (needed for Chrome extension new tab)
  setFavicon();
  
  await loadConfig();
  applyConfig();
  initClock();
  initSearch();
  initGitHub();
  initQuickLinks();
  initPomodoro();
  initSettings();
  initModals();
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function setFavicon() {
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/png';
  link.rel = 'icon';
  link.href = chrome.runtime.getURL('icons/icon48.png');
  document.head.appendChild(link);
}

// ============================================
// Config Management
// ============================================

async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (result) => {
      config = { ...DEFAULT_CONFIG, ...result };
      resolve();
    });
  });
}

async function saveConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.set(config, () => {
      resolve();
      showToast('Settings saved!');
    });
  });
}

function applyConfig() {
  // Apply theme
  applyTheme(config.theme);
  
  // Font
  document.body.style.fontFamily = `'${config.fontFamily}', 'Fira Code', monospace`;
  
  // Background
  const bgImage = document.getElementById('background-image');
  if (config.bgUrl) {
    bgImage.style.backgroundImage = `url('${config.bgUrl}')`;
  } else {
    bgImage.style.backgroundImage = 'none';
  }
  
  // Blur & Brightness
  document.documentElement.style.setProperty('--blur-amount', `${config.bgBlur}px`);
  document.documentElement.style.setProperty('--brightness-amount', config.bgBrightness / 100);
  
  // Search engine buttons
  document.querySelectorAll('.engine-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.engine === config.searchEngine);
  });
  
  // Visibility toggles
  const pomodoroContainer = document.getElementById('pomodoro-container');
  const quicklinksSection = document.querySelector('.quicklinks-section');
  
  if (pomodoroContainer) {
    pomodoroContainer.style.display = config.showPomodoro ? 'flex' : 'none';
  }
  if (quicklinksSection) {
    quicklinksSection.style.display = config.showQuickLinks ? 'flex' : 'none';
  }
  
  // Branding
  updateBranding();
}

function applyTheme(theme, reloadGraph = false) {
  let effectiveTheme = theme;
  
  if (theme === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  
  // Update meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = effectiveTheme === 'dark' ? '#0d1117' : '#ffffff';
  }
  
  // Reload GitHub graph to apply correct colors if requested
  if (reloadGraph && config.githubUsername) {
    loadGitHubContributions();
  }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (config.theme === 'system') {
    applyTheme('system', true);
  }
});

function updateBranding() {
  const logoText = document.getElementById('logo-text');
  
  if (logoText) {
    logoText.textContent = config.brandName || 'DevTab';
  }
  
  // Update page title
  document.title = config.brandName || 'DevTab';
}

// ============================================
// Clock
// ============================================

function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  let ampm = '';
  
  if (config.clockFormat === '12') {
    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
  }
  
  document.getElementById('clock-hours').textContent = hours.toString().padStart(2, '0');
  document.getElementById('clock-minutes').textContent = minutes;
  
  const secondsEl = document.getElementById('clock-seconds');
  secondsEl.textContent = config.showSeconds ? `:${seconds}` : '';
  secondsEl.style.display = config.showSeconds ? 'inline' : 'none';
  
  const ampmEl = document.getElementById('clock-ampm');
  ampmEl.textContent = ampm;
  ampmEl.style.display = config.clockFormat === '12' ? 'inline' : 'none';
  
  // Date
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  document.getElementById('clock-date').textContent = now.toLocaleDateString('en-US', options);
}

// ============================================
// Search
// ============================================

function initSearch() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const engines = document.querySelectorAll('.engine-btn');
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    
    // Check if URL
    if (isUrl(query)) {
      let url = query;
      if (!url.match(/^https?:\/\//i)) url = 'https://' + url;
      window.location.href = url;
    } else {
      window.location.href = SEARCH_ENGINES[config.searchEngine] + encodeURIComponent(query);
    }
  });
  
  engines.forEach(btn => {
    btn.addEventListener('click', () => {
      engines.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      config.searchEngine = btn.dataset.engine;
      saveConfig();
    });
  });
  
  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
    }
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

function isUrl(str) {
  return str.match(/^(https?:\/\/|www\.)/i) || 
         str.match(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+/i);
}

// ============================================
// GitHub
// ============================================

function initGitHub() {
  loadGitHubContributions();
  
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.githubUsername || changes.graphTheme)) {
      config.githubUsername = changes.githubUsername?.newValue ?? config.githubUsername;
      config.graphTheme = changes.graphTheme?.newValue ?? config.graphTheme;
      loadGitHubContributions();
    }
  });
}

function loadGitHubContributions() {
  const container = document.getElementById('github-chart-container');
  const profileLink = document.getElementById('github-profile-link');
  const usernameDisplay = document.getElementById('github-username-display');
  const username = config.githubUsername;
  
  if (!username) {
    container.innerHTML = `
      <div class="github-setup">
        <h3>Welcome, Developer! 👋</h3>
        <p>Click the settings icon to add your GitHub username.</p>
      </div>
    `;
    profileLink.style.display = 'none';
    return;
  }
  
  profileLink.style.display = 'flex';
  
  // Update profile link
  profileLink.href = `https://github.com/${username}`;
  usernameDisplay.textContent = `@${username}`;
  
  // Show loading
  container.innerHTML = `
    <div class="github-loading">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>Loading contributions...</p>
    </div>
  `;
  
  // Determine chart scheme based on app theme and graph theme
  let chartScheme = config.graphTheme;
  
  // For GitHub default theme, use appropriate colors for light/dark mode
  if (config.graphTheme === 'github') {
    const effectiveTheme = config.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.theme;
    
    // ghchart uses color names - use appropriate one
    chartScheme = effectiveTheme === 'light' ? '' : '';
  }
  
  // Build chart URL with cache busting
  const themePrefix = chartScheme && chartScheme !== 'github' ? `${chartScheme}/` : '';
  const cacheBuster = new Date().toISOString().split('T')[0];
  const chartUrl = `https://ghchart.rshah.org/${themePrefix}${username}?${cacheBuster}`;
  
  // Create image element
  const img = new Image();
  img.onload = function() {
    container.innerHTML = '';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.borderRadius = '8px';
    img.alt = `GitHub Contributions for ${username}`;
    
    // Apply filter for dark mode to make the graph look better
    const effectiveTheme = config.theme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.theme;
    
    if (effectiveTheme === 'dark' && config.graphTheme === 'github') {
      // Invert the white background for dark mode
      img.style.filter = 'invert(1) hue-rotate(180deg)';
      img.style.opacity = '0.9';
    }
    
    container.appendChild(img);
  };
  img.onerror = function() {
    container.innerHTML = `
      <div class="github-setup" style="color: var(--danger);">
        <h3>Failed to load contributions</h3>
        <p>Please check your GitHub username or try again later.</p>
      </div>
    `;
  };
  img.src = chartUrl;
}

window.handleGitHubError = function() {
  document.getElementById('github-chart-container').innerHTML = `
    <div class="github-setup" style="color: var(--danger);">
      <h3>Failed to load contributions</h3>
      <p>Please check your GitHub username.</p>
    </div>
  `;
};

// ============================================
// Quick Links
// ============================================

function initQuickLinks() {
  renderQuickLinks();
  document.getElementById('add-link-btn').addEventListener('click', () => {
    editingLinkIndex = null;
    openAddLinkModal();
  });
}

function renderQuickLinks() {
  const container = document.getElementById('quicklinks-container');
  container.innerHTML = '';
  
  config.quickLinks.forEach((link, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'quick-link-wrapper';
    wrapper.style.position = 'relative';
    
    const el = document.createElement('a');
    el.href = link.url;
    el.className = 'quick-link';
    el.title = link.name;
    
    // Get icon - custom URL, or auto-fetch from favicon service
    const iconHtml = getIconHtml(link);
    
    el.innerHTML = `
      <span class="quick-link-icon">${iconHtml}</span>
      <span class="quick-link-name">${link.name}</span>
      <button class="quick-link-edit" title="Edit link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    `;
    
    // Edit button click
    const editBtn = el.querySelector('.quick-link-edit');
    editBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      editingLinkIndex = index;
      openAddLinkModal(link);
    });
    
    // Right-click to edit (alternative)
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      editingLinkIndex = index;
      openAddLinkModal(link);
    });
    
    container.appendChild(el);
  });
}

function getIconHtml(link) {
  // If user provided a custom icon URL, use it
  if (link.icon && (link.icon.startsWith('http') || link.icon.startsWith('/'))) {
    return `<img src="${link.icon}" alt="${link.name}" class="quick-link-favicon" onerror="this.src='${getFaviconUrl(link.url)}'">`;
  }
  
  // If it's an emoji (legacy support), show it
  if (link.icon && !link.icon.startsWith('http')) {
    return link.icon;
  }
  
  // Auto-fetch favicon from the website
  const faviconUrl = getFaviconUrl(link.url);
  const backupUrl = getBackupFaviconUrl(link.url);
  
  return `<img src="${faviconUrl}" alt="${link.name}" class="quick-link-favicon" onerror="this.onerror=function(){this.src='${getDefaultFaviconSvg()}';}; this.src='${backupUrl}';">`;
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    // Use Google's favicon service - works for most sites including Google services
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return getDefaultFaviconSvg();
  }
}

function getBackupFaviconUrl(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // For Google services, try direct favicon
    if (domain.includes('google.com') || domain.includes('gmail.com') || domain.includes('youtube.com')) {
      return `https://${domain}/favicon.ico`;
    }
    
    // Fallback to DuckDuckGo's icon service
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return getDefaultFaviconSvg();
  }
}

function getDefaultFaviconSvg() {
  // Return a data URI for a simple link icon as ultimate fallback
  return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2358a6ff" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>')}`; 
}

function getDefaultIcon(url) {
  // Return empty - we now use favicons
  return '';
}

// ============================================
// Pomodoro Timer
// ============================================

function initPomodoro() {
  document.getElementById('pomo-start').addEventListener('click', togglePomodoro);
  document.getElementById('pomo-reset').addEventListener('click', resetPomodoro);
  document.getElementById('pomo-settings').addEventListener('click', () => openModal('pomo-modal'));
  
  document.querySelectorAll('.pomo-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pomo-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setPomoMode(btn.dataset.mode);
      closeModal('pomo-modal');
    });
  });
  
  // Initialize display
  pomodoroState.timeLeft = config.focusDuration * 60;
  pomodoroState.totalTime = config.focusDuration * 60;
  updatePomoDisplay();
}

function setPomoMode(mode) {
  pomodoroState.mode = mode;
  pomodoroState.isRunning = false;
  if (pomodoroState.interval) {
    clearInterval(pomodoroState.interval);
    pomodoroState.interval = null;
  }
  
  const container = document.getElementById('pomodoro-container');
  container.classList.remove('running', 'break-mode');
  
  switch (mode) {
    case 'focus':
      pomodoroState.totalTime = config.focusDuration * 60;
      document.getElementById('pomodoro-label').textContent = 'Focus Time';
      break;
    case 'break':
      pomodoroState.totalTime = config.shortBreak * 60;
      document.getElementById('pomodoro-label').textContent = 'Short Break';
      container.classList.add('break-mode');
      break;
    case 'longbreak':
      pomodoroState.totalTime = config.longBreak * 60;
      document.getElementById('pomodoro-label').textContent = 'Long Break';
      container.classList.add('break-mode');
      break;
  }
  
  pomodoroState.timeLeft = pomodoroState.totalTime;
  updatePomoDisplay();
  updatePomoButton();
}

function togglePomodoro() {
  if (pomodoroState.isRunning) {
    // Pause
    pomodoroState.isRunning = false;
    document.getElementById('pomodoro-container').classList.remove('running');
    if (pomodoroState.interval) {
      clearInterval(pomodoroState.interval);
      pomodoroState.interval = null;
    }
    playSound('pause');
  } else {
    // Start
    pomodoroState.isRunning = true;
    document.getElementById('pomodoro-container').classList.add('running');
    playSound('start');
    pomodoroState.interval = setInterval(() => {
      pomodoroState.timeLeft--;
      updatePomoDisplay();
      
      // Play tick sound in last 5 seconds
      if (pomodoroState.timeLeft <= 5 && pomodoroState.timeLeft > 0) {
        playSound('tick');
      }
      
      if (pomodoroState.timeLeft <= 0) completePomodoro();
    }, 1000);
  }
  updatePomoButton();
}

function resetPomodoro() {
  pomodoroState.isRunning = false;
  document.getElementById('pomodoro-container').classList.remove('running');
  if (pomodoroState.interval) {
    clearInterval(pomodoroState.interval);
    pomodoroState.interval = null;
  }
  pomodoroState.timeLeft = pomodoroState.totalTime;
  updatePomoDisplay();
  updatePomoButton();
}

function completePomodoro() {
  pomodoroState.isRunning = false;
  document.getElementById('pomodoro-container').classList.remove('running');
  if (pomodoroState.interval) {
    clearInterval(pomodoroState.interval);
    pomodoroState.interval = null;
  }
  
  // Play completion sound
  playSound('complete');
  
  // Show notification
  if (Notification.permission === 'granted') {
    new Notification('Pomodoro Complete!', {
      body: pomodoroState.mode === 'focus' ? 'Time for a break!' : 'Ready to focus?',
      icon: 'icons/icon128.png'
    });
  }
  
  // Auto-switch mode with appropriate sound
  setTimeout(() => {
    if (pomodoroState.mode === 'focus') {
      pomodoroState.sessions++;
      const nextMode = pomodoroState.sessions % 4 === 0 ? 'longbreak' : 'break';
      setPomoMode(nextMode);
      playSound('break'); // Relaxing sound for break time
    } else {
      setPomoMode('focus');
      playSound('focus'); // Motivating sound for focus time
    }
  }, 1000); // Slight delay so sounds don't overlap
}

function updatePomoDisplay() {
  const minutes = Math.floor(pomodoroState.timeLeft / 60);
  const seconds = pomodoroState.timeLeft % 60;
  document.getElementById('pomodoro-time').textContent = 
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const progress = ((pomodoroState.totalTime - pomodoroState.timeLeft) / pomodoroState.totalTime) * 100;
  document.getElementById('pomodoro-progress-bar').style.width = `${progress}%`;
}

function updatePomoButton() {
  const icon = document.getElementById('pomo-start-icon');
  if (pomodoroState.isRunning) {
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    icon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }
}

function playNotificationSound() {
  playSound('complete');
}

// Sound effects for Pomodoro
function playSound(type) {
  // Check if sounds are enabled
  if (!config.pomodoroSounds) return;
  
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    switch(type) {
      case 'start':
        // Rising tone - energizing start sound
        playTone(ctx, [
          { freq: 440, start: 0, duration: 0.1 },
          { freq: 554, start: 0.1, duration: 0.1 },
          { freq: 659, start: 0.2, duration: 0.15 }
        ]);
        break;
        
      case 'pause':
        // Soft descending tone
        playTone(ctx, [
          { freq: 520, start: 0, duration: 0.15 },
          { freq: 440, start: 0.12, duration: 0.15 }
        ]);
        break;
        
      case 'complete':
        // Success chime - pleasant completion sound
        playTone(ctx, [
          { freq: 523, start: 0, duration: 0.15 },
          { freq: 659, start: 0.15, duration: 0.15 },
          { freq: 784, start: 0.3, duration: 0.2 },
          { freq: 1047, start: 0.45, duration: 0.3 }
        ]);
        break;
        
      case 'break':
        // Relaxing tone - time for break
        playTone(ctx, [
          { freq: 396, start: 0, duration: 0.2 },
          { freq: 352, start: 0.15, duration: 0.2 },
          { freq: 330, start: 0.3, duration: 0.3 }
        ]);
        break;
        
      case 'focus':
        // Motivating tone - back to work
        playTone(ctx, [
          { freq: 330, start: 0, duration: 0.1 },
          { freq: 392, start: 0.1, duration: 0.1 },
          { freq: 523, start: 0.2, duration: 0.15 },
          { freq: 659, start: 0.35, duration: 0.2 }
        ]);
        break;
        
      case 'tick':
        // Subtle tick for last 10 seconds (optional)
        playTone(ctx, [
          { freq: 800, start: 0, duration: 0.05 }
        ], 0.1);
        break;
    }
  } catch (e) {
    console.log('Sound not available:', e);
  }
}

function playTone(ctx, notes, volume = 0.3) {
  notes.forEach(note => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.value = note.freq;
    osc.type = 'sine';
    
    const startTime = ctx.currentTime + note.start;
    const endTime = startTime + note.duration;
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, endTime);
    
    osc.start(startTime);
    osc.stop(endTime + 0.1);
  });
}

// ============================================
// Settings
// ============================================

function initSettings() {
  document.getElementById('open-settings').addEventListener('click', () => {
    populateSettingsForm();
    openModal('settings-modal');
  });
  
  document.getElementById('close-settings').addEventListener('click', () => closeModal('settings-modal'));
  document.getElementById('save-settings').addEventListener('click', saveSettingsFromForm);
  document.getElementById('reset-settings').addEventListener('click', resetToDefaults);
  
  // Live preview for sliders
  document.getElementById('background-blur').addEventListener('input', (e) => {
    document.getElementById('blur-value').textContent = `${e.target.value}px`;
    document.documentElement.style.setProperty('--blur-amount', `${e.target.value}px`);
  });
  
  document.getElementById('background-brightness').addEventListener('input', (e) => {
    const val = (e.target.value / 100).toFixed(2);
    document.getElementById('brightness-value').textContent = val;
    document.documentElement.style.setProperty('--brightness-amount', val);
  });
}

function populateSettingsForm() {
  document.getElementById('github-username').value = config.githubUsername || '';
  document.getElementById('graph-theme').value = config.graphTheme || 'github';
  document.getElementById('brand-name').value = config.brandName || 'DevTab';
  document.getElementById('app-theme').value = config.theme || 'dark';
  document.getElementById('font-family').value = config.fontFamily || 'JetBrains Mono';
  document.getElementById('background-url').value = config.bgUrl || '';
  document.getElementById('background-blur').value = config.bgBlur || 8;
  document.getElementById('blur-value').textContent = `${config.bgBlur || 8}px`;
  document.getElementById('background-brightness').value = config.bgBrightness || 40;
  document.getElementById('brightness-value').textContent = ((config.bgBrightness || 40) / 100).toFixed(2);
  document.getElementById('clock-format').value = config.clockFormat || '24';
  document.getElementById('show-seconds').checked = config.showSeconds !== false;
  document.getElementById('pomo-focus').value = config.focusDuration || 25;
  document.getElementById('pomo-break').value = config.shortBreak || 5;
  document.getElementById('pomo-long-break').value = config.longBreak || 15;
  document.getElementById('pomo-sounds').checked = config.pomodoroSounds !== false;
  // Visibility toggles
  document.getElementById('show-pomodoro').checked = config.showPomodoro !== false;
  document.getElementById('show-quicklinks').checked = config.showQuickLinks !== false;
}

function saveSettingsFromForm() {
  config.githubUsername = document.getElementById('github-username').value.trim();
  config.graphTheme = document.getElementById('graph-theme').value;
  config.brandName = document.getElementById('brand-name').value.trim() || 'DevTab';
  config.theme = document.getElementById('app-theme').value;
  config.fontFamily = document.getElementById('font-family').value;
  config.bgUrl = document.getElementById('background-url').value.trim();
  config.bgBlur = parseInt(document.getElementById('background-blur').value);
  config.bgBrightness = parseInt(document.getElementById('background-brightness').value);
  config.clockFormat = document.getElementById('clock-format').value;
  config.showSeconds = document.getElementById('show-seconds').checked;
  config.focusDuration = parseInt(document.getElementById('pomo-focus').value) || 25;
  config.shortBreak = parseInt(document.getElementById('pomo-break').value) || 5;
  config.longBreak = parseInt(document.getElementById('pomo-long-break').value) || 15;
  config.pomodoroSounds = document.getElementById('pomo-sounds').checked;
  // Visibility toggles
  config.showPomodoro = document.getElementById('show-pomodoro').checked;
  config.showQuickLinks = document.getElementById('show-quicklinks').checked;
  
  saveConfig();
  applyConfig();
  loadGitHubContributions();
  
  // Update pomodoro if needed
  if (!pomodoroState.isRunning) {
    setPomoMode(pomodoroState.mode);
  }
  
  closeModal('settings-modal');
}

function resetToDefaults() {
  if (confirm('Reset all settings to defaults?')) {
    config = { ...DEFAULT_CONFIG };
    saveConfig();
    applyConfig();
    loadGitHubContributions();
    renderQuickLinks();
    populateSettingsForm();
    closeModal('settings-modal');
  }
}

// ============================================
// Modals
// ============================================

function initModals() {
  // Close buttons
  document.getElementById('close-add-link').addEventListener('click', () => closeModal('add-link-modal'));
  document.getElementById('close-pomo-modal').addEventListener('click', () => closeModal('pomo-modal'));
  
  // Overlay click to close
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });
  
  // Save/Delete link
  document.getElementById('save-link').addEventListener('click', saveLink);
  document.getElementById('delete-link').addEventListener('click', deleteLink);
  
  // Logo click to open settings
  document.getElementById('logo-section').addEventListener('click', () => {
    populateSettingsForm();
    openModal('settings-modal');
    // Focus on brand name field
    setTimeout(() => document.getElementById('brand-name').focus(), 100);
  });
}

function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

function openAddLinkModal(link = null) {
  document.getElementById('link-modal-title').textContent = link ? 'Edit Quick Link' : 'Add Quick Link';
  document.getElementById('link-name').value = link?.name || '';
  document.getElementById('link-url').value = link?.url || '';
  document.getElementById('link-icon').value = link?.icon || '';
  document.getElementById('delete-link').style.display = link ? 'block' : 'none';
  openModal('add-link-modal');
}

function saveLink() {
  const name = document.getElementById('link-name').value.trim();
  const url = document.getElementById('link-url').value.trim();
  const icon = document.getElementById('link-icon').value.trim();
  
  if (!name || !url) {
    alert('Please fill in name and URL');
    return;
  }
  
  // Icon can be: empty (auto-fetch), URL (custom), or emoji (legacy)
  const link = { name, url, icon: icon };
  
  if (editingLinkIndex !== null) {
    config.quickLinks[editingLinkIndex] = link;
  } else {
    config.quickLinks.push(link);
  }
  
  saveConfig();
  renderQuickLinks();
  closeModal('add-link-modal');
}

function deleteLink() {
  if (editingLinkIndex !== null && confirm('Delete this link?')) {
    config.quickLinks.splice(editingLinkIndex, 1);
    saveConfig();
    renderQuickLinks();
    closeModal('add-link-modal');
  }
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--accent-primary);
      color: var(--bg-primary);
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      z-index: 3000;
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  setTimeout(() => toast.style.transform = 'translateX(-50%) translateY(0)', 10);
  setTimeout(() => toast.style.transform = 'translateX(-50%) translateY(100px)', 2500);
}
