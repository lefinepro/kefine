/**
 * Kefine Application TypeScript
 * Handles sidebar toggle, search combobox, keyboard shortcuts, posts, and settings
 */

// ===== Types =====
type KFElement = HTMLElement & (HTMLElement | Element);

interface KefineAPI {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSound: () => void;
  expandPost: (postId: string) => void;
  collapsePost: () => void;
}

interface AppElements {
  app: KFElement | null;
  sidebar: HTMLElement | null;
  logoToggle: HTMLElement | null;
  sidebarClose: HTMLElement | null;
  searchInput: HTMLInputElement | null;
  searchCombobox: HTMLElement | null;
  searchListbox: HTMLElement | null;
  sidebarSearch: HTMLInputElement | null;
  soundToggle: HTMLElement | null;
  themeSelect: HTMLSelectElement | null;
  loginButton: HTMLElement | null;
}

interface AppState {
  isSidebarOpen: boolean;
  isSoundEnabled: boolean;
  isSearchOpen: boolean;
  searchSelectedIndex: number;
  expandedPostId: string | null;
}

interface SearchResult {
  id: string;
  title: string;
  type: string;
  url: string;
}

// ===== Application Class =====
class KefineApp {
  private elements: AppElements;
  private state: AppState;
  private api: KefineAPI;
  private searchResults: SearchResult[] = [];

  constructor() {
    this.elements = this.initializeElements();
    this.state = {
      isSidebarOpen: false,
      isSoundEnabled: false,
      isSearchOpen: false,
      searchSelectedIndex: -1,
      expandedPostId: null
    };

    this.api = {
      toggleSidebar: this.toggleSidebar.bind(this),
      openSidebar: this.openSidebar.bind(this),
      closeSidebar: this.closeSidebar.bind(this),
      toggleSound: this.toggleSound.bind(this),
      expandPost: this.expandPost.bind(this),
      collapsePost: this.collapsePost.bind(this)
    };

    this.initialize();
  }

  private initializeElements(): AppElements {
    return {
      app: document.querySelector('kf-app') as KFElement,
      sidebar: document.getElementById('sidebar'),
      logoToggle: document.getElementById('logo-toggle'),
      sidebarClose: document.getElementById('sidebar-close'),
      searchInput: document.getElementById('search-input') as HTMLInputElement,
      searchCombobox: document.getElementById('search-combobox'),
      searchListbox: document.getElementById('search-listbox'),
      sidebarSearch: document.getElementById('sidebar-search') as HTMLInputElement,
      soundToggle: document.getElementById('sound-toggle'),
      themeSelect: document.getElementById('theme-select') as HTMLSelectElement,
      loginButton: document.getElementById('login-button')
    };
  }

  private initialize(): void {
    this.loadSettings();
    this.initEventListeners();
    this.initFilters();
    this.initNavigation();
    this.initCombobox();
    this.initPosts();
    this.exposeAPI();

    // Log initialization
    console.log('Kefine initialized');
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
    let overlay = document.querySelector('kf-overlay');
    if (!overlay) {
      overlay = document.createElement('kf-overlay');
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
    const overlay = document.querySelector('kf-overlay');
    if (overlay) {
      overlay.removeAttribute('visible');
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 250);
    }
  }

  // ===== Combobox Search Functions =====
  private initCombobox(): void {
    if (!this.elements.searchInput || !this.elements.searchCombobox || !this.elements.searchListbox) {
      return;
    }

    // Handle input changes
    this.elements.searchInput.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      this.handleSearchInput(target.value);
    });

    // Handle keyboard navigation in search
    this.elements.searchInput.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleComboboxKeydown(e);
    });

    // Handle focus
    this.elements.searchInput.addEventListener('focus', () => {
      if (this.searchResults.length > 0) {
        this.openSearchDropdown();
      }
    });

    // Handle click outside to close
    document.addEventListener('click', (e: MouseEvent) => {
      if (!this.elements.searchCombobox?.contains(e.target as Node)) {
        this.closeSearchDropdown();
      }
    });
  }

  private async handleSearchInput(query: string): Promise<void> {
    if (query.length < 2) {
      this.closeSearchDropdown();
      this.searchResults = [];
      return;
    }

    // Simulate search results (in a real app, this would be an API call)
    this.searchResults = this.getMockSearchResults(query);

    if (this.searchResults.length > 0) {
      this.renderSearchResults();
      this.openSearchDropdown();
    } else {
      this.closeSearchDropdown();
    }
  }

  private getMockSearchResults(query: string): SearchResult[] {
    // Mock results for demonstration
    const allResults: SearchResult[] = [
      { id: '1', title: 'Components', type: 'page', url: '/components' },
      { id: '2', title: 'Documentation', type: 'page', url: '/docs' },
      { id: '3', title: 'Examples', type: 'page', url: '/examples' },
      { id: '4', title: 'Settings', type: 'page', url: '/settings' },
      { id: '5', title: 'Button Component', type: 'component', url: '/components/button' },
      { id: '6', title: 'Card Component', type: 'component', url: '/components/card' },
      { id: '7', title: 'Badge Component', type: 'component', url: '/components/badge' }
    ];

    return allResults.filter(r =>
      r.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }

  private renderSearchResults(): void {
    if (!this.elements.searchListbox) return;

    this.elements.searchListbox.innerHTML = this.searchResults.map((result, index) => `
      <kf-combobox-option
        role="option"
        id="search-option-${result.id}"
        data-url="${result.url}"
        aria-selected="${index === this.state.searchSelectedIndex}">
        <wa-icon name="${result.type === 'page' ? 'file-lines' : 'puzzle-piece'}"></wa-icon>
        <span>${result.title}</span>
        <small class="text-muted ml-auto">${result.type}</small>
      </kf-combobox-option>
    `).join('');

    // Add click handlers
    this.elements.searchListbox.querySelectorAll('kf-combobox-option').forEach((option, index) => {
      option.addEventListener('click', () => {
        this.selectSearchResult(index);
      });
    });
  }

  private handleComboboxKeydown(e: KeyboardEvent): void {
    if (!this.state.isSearchOpen) {
      if (e.key === 'ArrowDown' && this.searchResults.length > 0) {
        e.preventDefault();
        this.openSearchDropdown();
        this.state.searchSelectedIndex = 0;
        this.updateSelectedOption();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.state.searchSelectedIndex = Math.min(
          this.state.searchSelectedIndex + 1,
          this.searchResults.length - 1
        );
        this.updateSelectedOption();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.state.searchSelectedIndex = Math.max(this.state.searchSelectedIndex - 1, 0);
        this.updateSelectedOption();
        break;

      case 'Enter':
        e.preventDefault();
        if (this.state.searchSelectedIndex >= 0) {
          this.selectSearchResult(this.state.searchSelectedIndex);
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.closeSearchDropdown();
        this.elements.searchInput?.blur();
        break;

      case 'Tab':
        this.closeSearchDropdown();
        break;
    }
  }

  private updateSelectedOption(): void {
    if (!this.elements.searchListbox) return;

    const options = this.elements.searchListbox.querySelectorAll('kf-combobox-option');
    options.forEach((option, index) => {
      option.setAttribute('aria-selected', String(index === this.state.searchSelectedIndex));
    });

    // Scroll into view if needed
    const selectedOption = options[this.state.searchSelectedIndex] as HTMLElement;
    if (selectedOption) {
      selectedOption.scrollIntoView({ block: 'nearest' });
    }
  }

  private selectSearchResult(index: number): void {
    const result = this.searchResults[index];
    if (result) {
      console.log('Selected:', result.title, result.url);
      // In a real app, navigate to the URL
      // window.location.href = result.url;
    }
    this.closeSearchDropdown();
  }

  private openSearchDropdown(): void {
    this.state.isSearchOpen = true;
    this.elements.searchListbox?.removeAttribute('hidden');
    this.elements.searchCombobox?.setAttribute('aria-expanded', 'true');
  }

  private closeSearchDropdown(): void {
    this.state.isSearchOpen = false;
    this.state.searchSelectedIndex = -1;
    this.elements.searchListbox?.setAttribute('hidden', '');
    this.elements.searchCombobox?.setAttribute('aria-expanded', 'false');
  }

  private focusSearch(): void {
    if (this.elements.searchInput) {
      this.elements.searchInput.focus();
    }
  }

  // ===== Post Functions =====
  private initPosts(): void {
    const posts = document.querySelectorAll('kf-post');
    posts.forEach(post => {
      post.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        // Don't expand if clicking on action buttons
        if (target.closest('kf-post-action') || target.closest('wa-button')) {
          return;
        }
        const postId = post.getAttribute('data-post-id');
        if (postId && !post.hasAttribute('expanded')) {
          this.expandPost(postId);
        }
      });
    });
  }

  public expandPost(postId: string): void {
    const post = document.querySelector(`kf-post[data-post-id="${postId}"]`);
    if (!post) return;

    // Close any previously expanded post
    if (this.state.expandedPostId) {
      this.collapsePost();
    }

    this.state.expandedPostId = postId;
    post.setAttribute('expanded', '');
    document.body.style.overflow = 'hidden';

    // Add close button if not exists
    if (!post.querySelector('.kf-post-close')) {
      const closeBtn = document.createElement('wa-button');
      closeBtn.className = 'kf-post-close';
      closeBtn.setAttribute('appearance', 'plain');
      closeBtn.setAttribute('variant', 'neutral');
      closeBtn.setAttribute('size', 'small');
      closeBtn.setAttribute('aria-label', 'Close post');
      closeBtn.innerHTML = '<wa-icon name="xmark"></wa-icon>';
      closeBtn.style.cssText = 'position: absolute; top: 1rem; right: 1rem; z-index: 10;';
      closeBtn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        this.collapsePost();
      });
      (post as HTMLElement).style.position = 'relative';
      post.appendChild(closeBtn);
    }

    // Handle Escape key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.collapsePost();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  public collapsePost(): void {
    if (!this.state.expandedPostId) return;

    const post = document.querySelector(`kf-post[data-post-id="${this.state.expandedPostId}"]`);
    if (post) {
      post.removeAttribute('expanded');
      const closeBtn = post.querySelector('.kf-post-close');
      if (closeBtn) {
        closeBtn.remove();
      }
    }

    document.body.style.overflow = '';
    this.state.expandedPostId = null;
  }

  // ===== Sound Functions =====
  public toggleSound(): void {
    this.state.isSoundEnabled = !this.state.isSoundEnabled;
    if (this.elements.soundToggle) {
      this.elements.soundToggle.setAttribute('aria-pressed', String(this.state.isSoundEnabled));
      // Update icon or visual state
      const icon = this.elements.soundToggle.querySelector('wa-icon');
      if (icon) {
        icon.setAttribute('name', this.state.isSoundEnabled ? 'volume-high' : 'volume-xmark');
      }
    }
    // Save preference
    this.saveSettings('sound-enabled', this.state.isSoundEnabled);
  }

  // ===== Filter Functions =====
  private initFilters(): void {
    const filterOptions = document.querySelectorAll('kf-filter-option');
    filterOptions.forEach(option => {
      option.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const checkbox = option.querySelector('wa-checkbox');
        if (checkbox) {
          const isChecked = checkbox.hasAttribute('checked');
          if (isChecked) {
            checkbox.removeAttribute('checked');
            option.removeAttribute('selected');
          } else {
            checkbox.setAttribute('checked', '');
            option.setAttribute('selected', '');
          }
          this.handleFilterChange();
        }
      });
    });
  }

  private handleFilterChange(): void {
    const selectedFilters: string[] = [];
    document.querySelectorAll('kf-filter-option[selected]').forEach(option => {
      const checkbox = option.querySelector('wa-checkbox');
      if (checkbox) {
        selectedFilters.push(checkbox.textContent?.trim() || '');
      }
    });
    console.log('Selected filters:', selectedFilters);
    // Apply filters to content
  }

  // ===== Navigation Functions =====
  private initNavigation(): void {
    const navItems = document.querySelectorAll('kf-nav-item');
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

  // ===== Keyboard Shortcuts =====
  private handleKeydown(event: KeyboardEvent): void {
    // Don't handle shortcuts when typing in inputs
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');

    // Global shortcuts (work even when typing)
    if (event.key === 'Escape') {
      if (this.state.expandedPostId) {
        this.collapsePost();
        event.preventDefault();
        return;
      }
      if (this.state.isSearchOpen) {
        this.closeSearchDropdown();
        event.preventDefault();
        return;
      }
      if (this.state.isSidebarOpen) {
        this.closeSidebar();
        event.preventDefault();
      }
      if (document.activeElement !== document.body) {
        (document.activeElement as HTMLElement)?.blur();
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

    // Sidebar search
    if (this.elements.sidebarSearch) {
      this.elements.sidebarSearch.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.handleSearchInput(target.value);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', this.handleKeydown.bind(this));

    // Settings toggles
    const settingsToggles = document.querySelectorAll('kf-setting-item input[type="checkbox"]');
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

    // Login button
    if (this.elements.loginButton) {
      this.elements.loginButton.addEventListener('click', () => {
        console.log('Login clicked');
        // Handle login action
      });
    }
  }

  private exposeAPI(): void {
    (window as any).Kefine = this.api;
  }
}

// ===== Initialization =====
function initializeApp(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new KefineApp());
  } else {
    new KefineApp();
  }
}

// Initialize the application
initializeApp();

export default KefineApp;
