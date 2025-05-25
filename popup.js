
class WebToNotionPopup {
  constructor() {
    this.elements = {
      saveBtn: document.getElementById('saveToNotion'),
      status: document.getElementById('status'),
      toggleConfig: document.getElementById('toggleConfig'),
      configForm: document.getElementById('configForm'),
      saveConfig: document.getElementById('saveConfig'),
      openaiKey: document.getElementById('openaiKey'),
      notionKey: document.getElementById('notionKey'),
      notionDbId: document.getElementById('notionDbId')
    };
    
    this.init();
  }
  
  init() {
    this.loadConfig();
    this.bindEvents();
  }
  
  bindEvents() {
    this.elements.saveBtn.addEventListener('click', () => this.saveToNotion());
    this.elements.toggleConfig.addEventListener('click', () => this.toggleConfig());
    this.elements.saveConfig.addEventListener('click', () => this.saveConfig());
  }
  
  async loadConfig() {
    try {
      const result = await browser.storage.local.get(['openaiKey', 'notionKey', 'notionDbId']);
      
      if (result.openaiKey) this.elements.openaiKey.value = result.openaiKey;
      if (result.notionKey) this.elements.notionKey.value = result.notionKey;
      if (result.notionDbId) this.elements.notionDbId.value = result.notionDbId;
      
      // Check if configuration is complete
      const hasConfig = result.openaiKey && result.notionKey && result.notionDbId;
      if (!hasConfig) {
        this.showStatus('Please configure your API keys first', 'error');
        this.elements.saveBtn.disabled = true;
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }
  
  toggleConfig() {
    this.elements.configForm.classList.toggle('visible');
  }
  
  async saveConfig() {
    const config = {
      openaiKey: this.elements.openaiKey.value.trim(),
      notionKey: this.elements.notionKey.value.trim(),
      notionDbId: this.elements.notionDbId.value.trim()
    };
    
    if (!config.openaiKey || !config.notionKey || !config.notionDbId) {
      this.showStatus('All fields are required', 'error');
      return;
    }
    
    try {
      await browser.storage.local.set(config);
      this.showStatus('Configuration saved successfully!', 'success');
      this.elements.saveBtn.disabled = false;
      this.elements.configForm.classList.remove('visible');
    } catch (error) {
      this.showStatus('Error saving configuration', 'error');
      console.error('Config save error:', error);
    }
  }
  
  async saveToNotion() {
    this.elements.saveBtn.disabled = true;
    this.showStatus('Processing page content...', 'loading');
    
    try {
      // Get current tab
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      // Send message to background script
      const response = await browser.runtime.sendMessage({
        action: 'saveToNotion',
        tabId: currentTab.id,
        url: currentTab.url,
        title: currentTab.title
      });
      
      if (response.success) {
        this.showStatus('Successfully saved to Notion!', 'success');
      } else {
        this.showStatus(response.error || 'Failed to save to Notion', 'error');
      }
    } catch (error) {
      this.showStatus('Error: ' + error.message, 'error');
      console.error('Save error:', error);
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
      }, 3000);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WebToNotionPopup();
});
