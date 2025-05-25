
// Content script for enhanced webpage content extraction
class WebContentExtractor {
  constructor() {
    this.init();
  }
  
  init() {
    // Listen for messages from background script
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractContent') {
        try {
          const content = this.extractContent();
          sendResponse({ success: true, content });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      }
    });
  }
  
  extractContent() {
    // Create a copy of the document to avoid modifying the original
    const doc = document.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.sidebar', '.menu', '.navigation', '.ads', '.advertisement',
      '.social-share', '.comments', '.related-posts', '.popup',
      '[role="banner"]', '[role="navigation"]', '[role="complementary"]'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Try to find the main content area
    let mainContent = doc.querySelector('main, article, .content, .post, #content, .entry-content');
    
    if (!mainContent) {
      // Fallback to body but try to exclude obvious non-content elements
      mainContent = doc.body;
    }
    
    if (!mainContent) {
      throw new Error('No content found on this page');
    }
    
    // Extract text content
    let text = mainContent.textContent || mainContent.innerText || '';
    
    // Clean up the text
    text = this.cleanText(text);
    
    return {
      text: text,
      wordCount: text.split(/\s+/).length,
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname
    };
  }
  
  cleanText(text) {
    // Remove extra whitespace and normalize line breaks
    text = text.replace(/\s+/g, ' '); // Replace multiple spaces with single space
    text = text.replace(/\n\s*\n/g, '\n\n'); // Normalize paragraph breaks
    text = text.trim();
    
    // Remove common noise patterns
    text = text.replace(/Click here to .*/gi, '');
    text = text.replace(/Read more.*/gi, '');
    text = text.replace(/Subscribe to .*/gi, '');
    text = text.replace(/Follow us on .*/gi, '');
    
    return text;
  }
}

// Initialize content extractor
new WebContentExtractor();
