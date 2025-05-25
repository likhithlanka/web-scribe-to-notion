class WebToNotionBackground {
  constructor() {
    this.supabaseUrl = 'https://ypkfdgvuipvfhktqqmpr.supabase.co';
    this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwa2ZkZ3Z1aXB2ZmhrdHFxbXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDAxNjMsImV4cCI6MjA2Mzc3NjE2M30.1TpqOeg3fPgSi8TR_TFrC99uyqqd_7XT03TaqvE6Saw';
    this.init();
  }
  
  init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'saveToNotion') {
        this.handleSaveToNotion(message)
          .then(result => sendResponse(result))
          .catch(error => {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // Keep message channel open for async response
      }
    });
    
    // Log when extension starts
    console.log('Web to Notion AI extension background script loaded');
  }
  
  async handleSaveToNotion(message) {
    try {
      console.log('Processing save to Notion request for:', message.url);
      
      // Get user settings
      const settings = await chrome.storage.local.get(['notionDbId']);
      
      if (!settings.notionDbId) {
        throw new Error('Notion Database ID not configured. Please configure it in the extension settings.');
      }
      
      console.log('Using Notion Database ID:', settings.notionDbId);
      
      // Extract page content
      const pageContent = await this.extractPageContent(message.tabId);
      console.log('Extracted content:', {
        title: pageContent.title,
        wordCount: pageContent.wordCount,
        domain: pageContent.domain
      });
      
      // Process with Supabase edge function
      const result = await this.processWithSupabase(
        message.user,
        pageContent,
        message.title,
        message.url,
        settings.notionDbId
      );
      
      console.log('Supabase processing complete:', result);
      
      return { success: true, result };
    } catch (error) {
      console.error('Save to Notion error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async extractPageContent(tabId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Content extraction timeout - page may not be ready'));
      }, 10000); // 10 second timeout
      
      chrome.tabs.sendMessage(tabId, { action: 'extractContent' }, (response) => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(new Error(`Content script error: ${chrome.runtime.lastError.message}`));
        } else if (response && response.success) {
          resolve(response.content);
        } else {
          reject(new Error(response?.error || 'Failed to extract content from page'));
        }
      });
    });
  }
  
  async processWithSupabase(user, content, title, url, notionDbId) {
    try {
      console.log('Sending request to Supabase edge function...');
      
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
        console.error('Supabase function error response:', errorData);
        throw new Error(`Supabase function error: ${response.status} - ${errorData}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error from Supabase function');
      }
      
      return result;
    } catch (error) {
      console.error('Supabase processing error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to processing service');
      } else if (error.message.includes('401')) {
        throw new Error('Authentication error: Please log in again');
      } else if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded: Please wait before trying again');
      } else {
        throw error;
      }
    }
  }
}

new WebToNotionBackground();
