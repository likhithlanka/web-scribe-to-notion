class WebContentExtractor {
  constructor() {
    this.init();
  }
  
  init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractContent') {
        try {
          const content = this.extractContent();
          sendResponse({ success: true, content });
        } catch (error) {
          console.error('Content extraction error:', error);
          sendResponse({ success: false, error: error.message });
        }
      }
      return true; // Keep message channel open for async response
    });
  }
  
  extractContent() {
    // Clone document to avoid modifying the original
    const doc = document.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.sidebar', '.menu', '.navigation', '.ads', '.advertisement',
      '.social-share', '.comments', '.related-posts', '.popup',
      '.cookie-banner', '.newsletter', '.subscription',
      '[role="banner"]', '[role="navigation"]', '[role="complementary"]',
      '[class*="ad-"]', '[id*="ad-"]', '[class*="advertisement"]',
      '.social', '.share', '.follow', '.subscribe'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Try to find main content area with various selectors
    let mainContent = doc.querySelector([
      'main',
      'article', 
      '.content', 
      '.post', 
      '.entry-content',
      '.article-content',
      '.story-body',
      '.post-content',
      '#content',
      '#main',
      '.main-content'
    ].join(', '));
    
    // Fallback to body if no main content area found
    if (!mainContent) {
      mainContent = doc.body;
    }
    
    if (!mainContent) {
      throw new Error('No content found on this page');
    }
    
    // Extract text content
    let text = mainContent.textContent || mainContent.innerText || '';
    
    // Clean and normalize the text
    text = this.cleanText(text);
    
    // Get page metadata
    const metadata = this.extractMetadata();
    
    return {
      text: text,
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      title: document.title || 'Untitled',
      url: window.location.href,
      domain: window.location.hostname,
      ...metadata
    };
  }
  
  extractMetadata() {
    const metadata = {};
    
    // Try to get meta description
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      metadata.description = description.getAttribute('content');
    }
    
    // Try to get Open Graph data
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      metadata.ogTitle = ogTitle.getAttribute('content');
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      metadata.ogDescription = ogDescription.getAttribute('content');
    }
    
    // Try to get article author
    const author = document.querySelector('meta[name="author"]') || 
                  document.querySelector('[rel="author"]') ||
                  document.querySelector('.author');
    if (author) {
      metadata.author = author.getAttribute('content') || author.textContent;
    }
    
    // Try to get publication date
    const dateElement = document.querySelector('time[datetime]') ||
                       document.querySelector('meta[property="article:published_time"]') ||
                       document.querySelector('.date, .published, .timestamp');
    if (dateElement) {
      metadata.publishedDate = dateElement.getAttribute('datetime') || 
                              dateElement.getAttribute('content') ||
                              dateElement.textContent;
    }
    
    return metadata;
  }
  
  cleanText(text) {
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ');
    
    // Clean up line breaks
    text = text.replace(/\n\s*\n/g, '\n\n');
    
    // Remove common unwanted text patterns
    text = text.replace(/Click here to .*/gi, '');
    text = text.replace(/Read more.*/gi, '');
    text = text.replace(/Subscribe to .*/gi, '');
    text = text.replace(/Follow us on .*/gi, '');
    text = text.replace(/Share this.*/gi, '');
    text = text.replace(/Advertisement.*/gi, '');
    text = text.replace(/Cookie.*/gi, '');
    
    // Remove excessive punctuation
    text = text.replace(/\.{3,}/g, '...');
    text = text.replace(/!{2,}/g, '!');
    text = text.replace(/\?{2,}/g, '?');
    
    // Trim and return
    return text.trim();
  }
}

new WebContentExtractor();
