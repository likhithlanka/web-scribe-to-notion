
class WebToNotionPopup {
  constructor() {
    this.supabaseUrl = 'https://ypkfdgvuipvfhktqqmpr.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwa2ZkZ3Z1aXB2ZmhrdHFxbXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDAxNjMsImV4cCI6MjA2Mzc3NjE2M30.1TpqOeg3fPgSi8TR_TFrC99uyqqd_7XT03TaqvE6Saw';
    
    this.elements = {
      saveBtn: document.getElementById('saveToNotion'),
      status: document.getElementById('status'),
      toggleSettings: document.getElementById('toggleSettings'),
      settingsForm: document.getElementById('settingsForm'),
      saveSettings: document.getElementById('saveSettings'),
      notionDbId: document.getElementById('notionDbId'),
      
      // Auth elements
      authSection: document.getElementById('authSection'),
      loginForm: document.getElementById('loginForm'),
      userInfo: document.getElementById('userInfo'),
      userEmail: document.getElementById('userEmail'),
      email: document.getElementById('email'),
      password: document.getElementById('password'),
      loginBtn: document.getElementById('loginBtn'),
      signupBtn: document.getElementById('signupBtn'),
      logoutBtn: document.getElementById('logoutBtn')
    };
    
    this.user = null;
    this.init();
  }
  
  init() {
    this.checkAuthStatus();
    this.loadSettings();
    this.bindEvents();
  }
  
  bindEvents() {
    this.elements.saveBtn.addEventListener('click', () => this.saveToNotion());
    this.elements.toggleSettings.addEventListener('click', () => this.toggleSettings());
    this.elements.saveSettings.addEventListener('click', () => this.saveSettings());
    this.elements.loginBtn.addEventListener('click', () => this.login());
    this.elements.signupBtn.addEventListener('click', () => this.signup());
    this.elements.logoutBtn.addEventListener('click', () => this.logout());
  }
  
  async checkAuthStatus() {
    try {
      const { data } = await browser.storage.local.get(['supabase_session']);
      if (data.supabase_session) {
        this.user = data.supabase_session.user;
        this.updateAuthUI();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  }
  
  async login() {
    const email = this.elements.email.value.trim();
    const password = this.elements.password.value.trim();
    
    if (!email || !password) {
      this.showStatus('Please enter email and password', 'error');
      return;
    }
    
    this.elements.loginBtn.disabled = true;
    this.showStatus('Logging in...', 'loading');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.user = data.user;
        await browser.storage.local.set({ supabase_session: data });
        this.updateAuthUI();
        this.showStatus('Logged in successfully!', 'success');
      } else {
        this.showStatus(data.error_description || 'Login failed', 'error');
      }
    } catch (error) {
      this.showStatus('Login error: ' + error.message, 'error');
    } finally {
      this.elements.loginBtn.disabled = false;
    }
  }
  
  async signup() {
    const email = this.elements.email.value.trim();
    const password = this.elements.password.value.trim();
    
    if (!email || !password) {
      this.showStatus('Please enter email and password', 'error');
      return;
    }
    
    if (password.length < 6) {
      this.showStatus('Password must be at least 6 characters', 'error');
      return;
    }
    
    this.elements.signupBtn.disabled = true;
    this.showStatus('Creating account...', 'loading');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.user && !data.user.email_confirmed_at) {
          this.showStatus('Account created! Please check your email for verification.', 'success');
        } else {
          this.user = data.user;
          await browser.storage.local.set({ supabase_session: data });
          this.updateAuthUI();
          this.showStatus('Account created and logged in!', 'success');
        }
      } else {
        this.showStatus(data.error_description || 'Signup failed', 'error');
      }
    } catch (error) {
      this.showStatus('Signup error: ' + error.message, 'error');
    } finally {
      this.elements.signupBtn.disabled = false;
    }
  }
  
  async logout() {
    try {
      await browser.storage.local.remove(['supabase_session']);
      this.user = null;
      this.updateAuthUI();
      this.showStatus('Logged out successfully', 'success');
    } catch (error) {
      this.showStatus('Logout error: ' + error.message, 'error');
    }
  }
  
  updateAuthUI() {
    if (this.user) {
      this.elements.loginForm.style.display = 'none';
      this.elements.userInfo.style.display = 'block';
      this.elements.userEmail.textContent = this.user.email;
      this.elements.authSection.classList.add('authenticated');
      this.elements.saveBtn.disabled = false;
    } else {
      this.elements.loginForm.style.display = 'block';
      this.elements.userInfo.style.display = 'none';
      this.elements.authSection.classList.remove('authenticated');
      this.elements.saveBtn.disabled = true;
    }
  }
  
  async loadSettings() {
    try {
      const result = await browser.storage.local.get(['notionDbId']);
      if (result.notionDbId) this.elements.notionDbId.value = result.notionDbId;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  toggleSettings() {
    this.elements.settingsForm.classList.toggle('visible');
  }
  
  async saveSettings() {
    const settings = {
      notionDbId: this.elements.notionDbId.value.trim()
    };
    
    if (!settings.notionDbId) {
      this.showStatus('Notion Database ID is required', 'error');
      return;
    }
    
    // Validate Notion Database ID format (should be 32 characters hex)
    if (!/^[a-f0-9]{32}$/.test(settings.notionDbId)) {
      this.showStatus('Invalid Notion Database ID format. It should be 32 characters long.', 'error');
      return;
    }
    
    try {
      await browser.storage.local.set(settings);
      this.showStatus('Settings saved successfully!', 'success');
      this.elements.settingsForm.classList.remove('visible');
    } catch (error) {
      this.showStatus('Error saving settings', 'error');
    }
  }
  
  async saveToNotion() {
    if (!this.user) {
      this.showStatus('Please login first', 'error');
      return;
    }
    
    // Check if Notion Database ID is configured
    const settings = await browser.storage.local.get(['notionDbId']);
    if (!settings.notionDbId) {
      this.showStatus('Please configure your Notion Database ID in settings', 'error');
      this.elements.settingsForm.classList.add('visible');
      return;
    }
    
    this.elements.saveBtn.disabled = true;
    this.showStatus('Extracting page content...', 'loading');
    
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      // Basic validation for supported URLs
      if (currentTab.url.startsWith('chrome://') || 
          currentTab.url.startsWith('moz-extension://') || 
          currentTab.url.startsWith('about:')) {
        this.showStatus('Cannot save browser internal pages', 'error');
        return;
      }
      
      this.showStatus('Processing with AI...', 'loading');
      
      const response = await browser.runtime.sendMessage({
        action: 'saveToNotion',
        tabId: currentTab.id,
        url: currentTab.url,
        title: currentTab.title,
        user: this.user
      });
      
      if (response.success) {
        this.showStatus('✅ Successfully saved to Notion!', 'success');
        if (response.result && response.result.notionPageId) {
          console.log('Notion page created:', response.result.notionPageId);
        }
      } else {
        this.showStatus('❌ ' + (response.error || 'Failed to save to Notion'), 'error');
      }
    } catch (error) {
      console.error('Save error:', error);
      this.showStatus('❌ Error: ' + error.message, 'error');
    } finally {
      this.elements.saveBtn.disabled = false;
    }
  }
  
  showStatus(message, type) {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
    this.elements.status.style.display = 'block';
    
    if (type === 'success') {
      setTimeout(() => {
        this.elements.status.style.display = 'none';
      }, 5000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new WebToNotionPopup();
});
