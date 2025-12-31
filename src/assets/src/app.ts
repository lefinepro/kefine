/**
 * Kemal Template Application TypeScript
 * Handles sidebar toggle, search, keyboard shortcuts, and settings
 */

// ===== Types =====
type KTElement = HTMLElement & (HTMLElement | Element);

interface KemalTemplateAPI {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSound: () => void;
  updateCounter: (current: number, total: number) => void;
}

interface AppElements {
  app: KTElement | null;
  sidebar: HTMLElement | null;
  logoToggle: HTMLElement | null;
  sidebarClose: HTMLElement | null;
  searchInput: HTMLInputElement | null;
  sidebarSearch: HTMLInputElement | null;
  soundToggle: HTMLElement | null;
  themeSelect: HTMLSelectElement | null;
}

interface AppState {
  isSidebarOpen: boolean;
  isSoundEnabled: boolean;
}

// ===== Application Class =====
class KemalTemplateApp {
  private elements: AppElements;
  private state: AppState;
  private api: KemalTemplateAPI;

  constructor() {
    this.elements = this.initializeElements();
    this.state = {
      isSidebarOpen: false,
      isSoundEnabled: false
    };
    
    this.api = {
      toggleSidebar: this.toggleSidebar.bind(this),
      openSidebar: this.openSidebar.bind(this),
      closeSidebar: this.closeSidebar.bind(this),
      toggleSound: this.toggleSound.bind(this),
      updateCounter: this.updateCounter.bind(this)
    };
    
    this.initialize();
  }

  private initializeElements(): AppElements {
    return {
      app: document.querySelector('kt-app') as KTElement,
      sidebar: document.getElementById('sidebar'),
      logoToggle: document.getElementById('logo-toggle'),
      sidebarClose: document.getElementById('sidebar-close'),
      searchInput: document.getElementById('search-input') as HTMLInputElement,
      sidebarSearch: document.getElementById('sidebar-search') as HTMLInputElement,
      soundToggle: document.getElementById('sound-toggle'),
      themeSelect: document.getElementById('theme-select') as HTMLSelectElement
    };
  }

  private initialize(): void {
    this.loadSettings();
    this.initEventListeners();
    this.initFilters();
    this.initNavigation();
    this.exposeAPI();
    
    // Log initialization
    console.log('Kemal Template initialized');
    console.log('Keyboard shortcuts:');
    console.log('  / - Focus search');
    console.log('  Ctrl+B - Toggle sidebar');
    console.log('  M - Toggle sound');
    console.log('  Esc - Close panels');
  }

  private loadSettings(): void {
    // Load saved settings from localStorage
    const savedSound = localStorage.getItem('sound-enabled');
    if (savedSound !== null) {
      this.state.isSoundEnabled = savedSound === 'true';
      if (this.elements.soundToggle) {
        this.elements.soundToggle.setAttribute('aria-pressed', String(this.state.isSoundEnabled));
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

  private saveSettings(key: string, value: boolean | string): void {
    localStorage.setItem(key, String(value));
  }

  // ===== Sidebar Functions =====
  private openSidebar(): void {
    this.state.isSidebarOpen = true;
    if (this.elements.sidebar) this.elements.sidebar.setAttribute('open', '');
    if (this.elements.app) this.elements.app.setAttribute('sidebar-open', '');
    this.createOverlay();
  }

  private closeSidebar(): void {
    this.state.isSidebarOpen = false;
    if (this.elements.sidebar) this.elements.sidebar.removeAttribute('open');
    if (this.elements.app) this.elements.app.removeAttribute('sidebar-open');
    this.removeOverlay();
  }

  public toggleSidebar(): void {
    if (this.state.isSidebarOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  // ===== Overlay Functions =====
  private createOverlay(): void {
    let overlay = document.querySelector('kt-overlay');
    if (!overlay) {
      overlay = document.createElement('kt-overlay');
      overlay.addEventListener('click', this.closeSidebar.bind(this));
      document.body.appendChild(overlay);
    }
    // Force reflow for transition
    if (overlay) {
      (overlay as HTMLElement).offsetHeight;
      overlay.setAttribute('visible', '');
    }
  }

  private removeOverlay(): void {
    const overlay = document.querySelector('kt-overlay');
    if (overlay) {
      overlay.removeAttribute('visible');
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 250);
    }
  }

  // ===== Search Functions =====
  private focusSearch(): void {
    if (this.elements.searchInput) {
      this.elements.searchInput.focus();
    }
  }

  private handleSearch(query: string): void {
    console.log('Search query:', query);
    // In a real application, this would make an API call
    // fetch(`/api/search?q=${encodeURIComponent(query)}`)
    //   .then(response => response.json())
    //   .then(data => displayResults(data));
  }

  // ===== Sound Functions =====
  public toggleSound(): void {
    this.state.isSoundEnabled = !this.state.isSoundEnabled;
    if (this.elements.soundToggle) {
      this.elements.soundToggle.setAttribute('aria-pressed', String(this.state.isSoundEnabled));
      // Update icon or visual state
      const icon = this.elements.soundToggle.querySelector('svg');
      if (icon) {
        icon.style.opacity = this.state.isSoundEnabled ? '1' : '0.5';
      }
    }
    // Save preference
    this.saveSettings('sound-enabled', this.state.isSoundEnabled);
  }

  private playSound(type: string): void {
    if (!this.state.isSoundEnabled) return;
    // Sound implementation would go here
    // Could use Web Audio API or Audio elements
  }

  // ===== Filter Functions =====
  private initFilters(): void {
    const filterOptions = document.querySelectorAll('kt-filter-option');
    filterOptions.forEach(option => {
      option.addEventListener('click', () => {
        const checkbox = option.querySelector('input[type="checkbox"]') as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          option.toggleAttribute('selected', checkbox.checked);
          this.handleFilterChange();
        }
      });
    });
  }

  private handleFilterChange(): void {
    const selectedFilters: string[] = [];
    document.querySelectorAll('kt-filter-option[selected]').forEach(option => {
      const label = option.querySelector('span');
      if (label) {
        selectedFilters.push(label.textContent || '');
      }
    });
    console.log('Selected filters:', selectedFilters);
    // Apply filters to content
  }

  // ===== Navigation Functions =====
  private initNavigation(): void {
    const navItems = document.querySelectorAll('kt-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove active from all items
        navItems.forEach(nav => nav.removeAttribute('active'));
        // Set active on clicked item
        item.setAttribute('active', '');
        // Handle navigation
        const label = item.querySelector('span');
        if (label) {
          console.log('Navigate to:', label.textContent);
        }
      });
    });
  }

  // ===== Counter Animation =====
  public updateCounter(current: number, total: number): void {
    const currentEl = document.querySelector('kt-counter-current');
    const totalEl = document.querySelector('kt-counter-total');
    if (currentEl) currentEl.textContent = current.toString();
    if (totalEl) totalEl.textContent = total.toString();
  }

  // ===== Keyboard Shortcuts =====
  private handleKeydown(event: KeyboardEvent): void {
    // Don't handle shortcuts when typing in inputs
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');

    // Global shortcuts (work even when typing)
    if (event.key === 'Escape') {
      if (this.state.isSidebarOpen) {
        this.closeSidebar();
        event.preventDefault();
      }
      if (document.activeElement !== document.body) {
        document.activeElement?.blur();
      }
      return;
    }

    // Skip other shortcuts when typing
    if (isTyping) return;

    switch (event.key) {
      case '/':
        event.preventDefault();
        this.focusSearch();
        break;

      case 'm':
      case 'M':
        event.preventDefault();
        this.toggleSound();
        break;

      case 'b':
      case 'B':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.toggleSidebar();
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

  // ===== Event Listeners =====
  private initEventListeners(): void {
    // Sidebar toggle
    if (this.elements.logoToggle) {
      this.elements.logoToggle.addEventListener('click', this.toggleSidebar.bind(this));
    }

    // Sidebar close
    if (this.elements.sidebarClose) {
      this.elements.sidebarClose.addEventListener('click', this.closeSidebar.bind(this));
    }

    // Sound toggle
    if (this.elements.soundToggle) {
      this.elements.soundToggle.addEventListener('click', this.toggleSound.bind(this));
    }

    // Search input
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.handleSearch(target.value);
      });
      this.elements.searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
      });
    }

    // Sidebar search
    if (this.elements.sidebarSearch) {
      this.elements.sidebarSearch.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.handleSearch(target.value);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeydown.bind(this));

    // Settings toggles
    const settingsToggles = document.querySelectorAll('kt-setting-item input[type="checkbox"]');
    settingsToggles.forEach(toggle => {
      toggle.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.saveSettings(target.id, target.checked);
      });
    });

    // Theme select
    if (this.elements.themeSelect) {
      this.elements.themeSelect.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLSelectElement;
        document.documentElement.setAttribute('data-theme', target.value);
        this.saveSettings('theme', target.value);
      });
    }
  }

  private exposeAPI(): void {
    (window as any).KemalTemplate = this.api;
  }
}

// ===== Initialization =====
function initializeApp(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new KemalTemplateApp());
  } else {
    new KemalTemplateApp();
  }
}

// Initialize the application
initializeApp();

export default KemalTemplateApp;