
class WebContentExtractor {
  constructor() {
    this.init();
  }
  
  init() {
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
    const doc = document.cloneNode(true);
    
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
    
    let mainContent = doc.querySelector('main, article, .content, .post, #content, .entry-content');
    
    if (!mainContent) {
      mainContent = doc.body;
    }
    
    if (!mainContent) {
      throw new Error('No content found on this page');
    }
    
    let text = mainContent.textContent || mainContent.innerText || '';
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
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n\n');
    text = text.trim();
    
    text = text.replace(/Click here to .*/gi, '');
    text = text.replace(/Read more.*/gi, '');
    text = text.replace(/Subscribe to .*/gi, '');
    text = text.replace(/Follow us on .*/gi, '');
    
    return text;
  }
}

new WebContentExtractor();
