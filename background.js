
class WebToNotionBackground {
  constructor() {
    this.supabaseUrl = 'https://ypkfdgvuipvfhktqqmpr.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwa2ZkZ3Z1aXB2ZmhrdHFxbXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDAxNjMsImV4cCI6MjA2Mzc3NjE2M30.1TpqOeg3fPgSi8TR_TFrC99uyqqd_7XT03TaqvE6Saw';
    this.init();
  }
  
  init() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'saveToNotion') {
        this.handleSaveToNotion(message)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
      }
    });
  }
  
  async handleSaveToNotion(message) {
    try {
      // Get user settings
      const settings = await browser.storage.local.get(['notionDbId']);
      
      if (!settings.notionDbId) {
        throw new Error('Notion Database ID not configured');
      }
      
      // Extract page content
      const pageContent = await this.extractPageContent(message.tabId);
      
      // Process with Supabase edge function
      const result = await this.processWithSupabase(
        message.user,
        pageContent,
        message.title,
        message.url,
        settings.notionDbId
      );
      
      return { success: true, result };
    } catch (error) {
      console.error('Save to Notion error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async extractPageContent(tabId) {
    return new Promise((resolve, reject) => {
      browser.tabs.sendMessage(tabId, { action: 'extractContent' }, (response) => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        } else if (response && response.success) {
          resolve(response.content);
        } else {
          reject(new Error(response?.error || 'Failed to extract content'));
        }
      });
    });
  }
  
  async processWithSupabase(user, content, title, url, notionDbId) {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/process-notion-save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: user,
          content: content,
          title: title,
          url: url,
          notionDbId: notionDbId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Supabase function error: ${response.status} - ${errorData}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Supabase processing error:', error);
      throw error;
    }
  }
}

new WebToNotionBackground();
