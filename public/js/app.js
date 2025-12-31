/**
 * Kemal Template Application JavaScript
 * Handles sidebar toggle, search, keyboard shortcuts, and settings
 */

(function() {
  'use strict';

  // ===== DOM Elements =====
  const app = document.querySelector('kt-app');
  const sidebar = document.getElementById('sidebar');
  const logoToggle = document.getElementById('logo-toggle');
  const sidebarClose = document.getElementById('sidebar-close');
  const searchInput = document.getElementById('search-input');
  const sidebarSearch = document.getElementById('sidebar-search');
  const soundToggle = document.getElementById('sound-toggle');

  // ===== State =====
  let isSidebarOpen = false;
  let isSoundEnabled = false;

  // ===== Sidebar Functions =====
  function openSidebar() {
    isSidebarOpen = true;
    sidebar.setAttribute('open', '');
    app.setAttribute('sidebar-open', '');
    createOverlay();
  }

  function closeSidebar() {
    isSidebarOpen = false;
    sidebar.removeAttribute('open');
    app.removeAttribute('sidebar-open');
    removeOverlay();
  }

  function toggleSidebar() {
    if (isSidebarOpen) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  // ===== Overlay Functions =====
  function createOverlay() {
    let overlay = document.querySelector('kt-overlay');
    if (!overlay) {
      overlay = document.createElement('kt-overlay');
      overlay.addEventListener('click', closeSidebar);
      document.body.appendChild(overlay);
    }
    // Force reflow for transition
    overlay.offsetHeight;
    overlay.setAttribute('visible', '');
  }

  function removeOverlay() {
    const overlay = document.querySelector('kt-overlay');
    if (overlay) {
      overlay.removeAttribute('visible');
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 250);
    }
  }

  // ===== Search Functions =====
  function focusSearch() {
    if (searchInput) {
      searchInput.focus();
    }
  }

  function handleSearch(query) {
    console.log('Search query:', query);
    // In a real application, this would make an API call
    // fetch(`/api/search?q=${encodeURIComponent(query)}`)
    //   .then(response => response.json())
    //   .then(data => displayResults(data));
  }

  // ===== Sound Functions =====
  function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    if (soundToggle) {
      soundToggle.setAttribute('aria-pressed', isSoundEnabled);
      // Update icon or visual state
      const icon = soundToggle.querySelector('svg');
      if (icon) {
        icon.style.opacity = isSoundEnabled ? '1' : '0.5';
      }
    }
    // Save preference
    localStorage.setItem('sound-enabled', isSoundEnabled);
  }

  function playSound(type) {
    if (!isSoundEnabled) return;
    // Sound implementation would go here
    // Could use Web Audio API or Audio elements
  }

  // ===== Settings Functions =====
  function loadSettings() {
    // Load saved settings from localStorage
    const savedSound = localStorage.getItem('sound-enabled');
    if (savedSound !== null) {
      isSoundEnabled = savedSound === 'true';
      if (soundToggle) {
        soundToggle.setAttribute('aria-pressed', isSoundEnabled);
      }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    const savedAnimations = localStorage.getItem('animations');
    if (savedAnimations === 'false') {
      document.documentElement.classList.add('reduce-motion');
    }
  }

  function saveSettings(key, value) {
    localStorage.setItem(key, value);
  }

  // ===== Keyboard Shortcuts =====
  function handleKeydown(event) {
    // Don't handle shortcuts when typing in inputs
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

    // Global shortcuts (work even when typing)
    if (event.key === 'Escape') {
      if (isSidebarOpen) {
        closeSidebar();
        event.preventDefault();
      }
      if (document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      return;
    }

    // Skip other shortcuts when typing
    if (isTyping) return;

    switch (event.key) {
      case '/':
        event.preventDefault();
        focusSearch();
        break;

      case 'm':
      case 'M':
        event.preventDefault();
        toggleSound();
        break;

      case 'b':
      case 'B':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          toggleSidebar();
        }
        break;

      case 'ArrowLeft':
        if (event.shiftKey) {
          // Previous item
        }
        break;

      case 'ArrowRight':
        if (event.shiftKey) {
          // Next item
        }
        break;

      case 'ArrowUp':
        // Previous step
        break;

      case 'ArrowDown':
        // Next step / start
        break;
    }
  }

  // ===== Filter Functions =====
  function initFilters() {
    const filterOptions = document.querySelectorAll('kt-filter-option');
    filterOptions.forEach(option => {
      option.addEventListener('click', function() {
        const checkbox = this.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          this.toggleAttribute('selected', checkbox.checked);
          handleFilterChange();
        }
      });
    });
  }

  function handleFilterChange() {
    const selectedFilters = [];
    document.querySelectorAll('kt-filter-option[selected]').forEach(option => {
      const label = option.querySelector('span');
      if (label) {
        selectedFilters.push(label.textContent);
      }
    });
    console.log('Selected filters:', selectedFilters);
    // Apply filters to content
  }

  // ===== Navigation Functions =====
  function initNavigation() {
    const navItems = document.querySelectorAll('kt-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        // Remove active from all items
        navItems.forEach(nav => nav.removeAttribute('active'));
        // Set active on clicked item
        this.setAttribute('active', '');
        // Handle navigation
        const label = this.querySelector('span');
        if (label) {
          console.log('Navigate to:', label.textContent);
        }
      });
    });
  }

  // ===== Counter Animation =====
  function updateCounter(current, total) {
    const currentEl = document.querySelector('kt-counter-current');
    const totalEl = document.querySelector('kt-counter-total');
    if (currentEl) currentEl.textContent = current;
    if (totalEl) totalEl.textContent = total;
  }

  // ===== Event Listeners =====
  function initEventListeners() {
    // Sidebar toggle
    if (logoToggle) {
      logoToggle.addEventListener('click', toggleSidebar);
    }

    // Sidebar close
    if (sidebarClose) {
      sidebarClose.addEventListener('click', closeSidebar);
    }

    // Sound toggle
    if (soundToggle) {
      soundToggle.addEventListener('click', toggleSound);
    }

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        handleSearch(this.value);
      });
      searchInput.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
          this.blur();
        }
      });
    }

    // Sidebar search
    if (sidebarSearch) {
      sidebarSearch.addEventListener('input', function() {
        handleSearch(this.value);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeydown);

    // Settings toggles
    const settingsToggles = document.querySelectorAll('kt-setting-item input[type="checkbox"]');
    settingsToggles.forEach(toggle => {
      toggle.addEventListener('change', function() {
        saveSettings(this.id, this.checked);
      });
    });

    // Theme select
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.addEventListener('change', function() {
        document.documentElement.setAttribute('data-theme', this.value);
        saveSettings('theme', this.value);
      });
    }
  }

  // ===== Initialization =====
  function init() {
    loadSettings();
    initEventListeners();
    initFilters();
    initNavigation();

    // Log initialization
    console.log('Kemal Template initialized');
    console.log('Keyboard shortcuts:');
    console.log('  / - Focus search');
    console.log('  Ctrl+B - Toggle sidebar');
    console.log('  M - Toggle sound');
    console.log('  Esc - Close panels');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for debugging
  window.KemalTemplate = {
    toggleSidebar,
    openSidebar,
    closeSidebar,
    toggleSound,
    updateCounter
  };

})();
