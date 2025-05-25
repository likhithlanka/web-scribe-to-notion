
class WebToNotionBackground {
  constructor() {
    this.init();
  }
  
  init() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'saveToNotion') {
        this.handleSaveToNotion(message)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Will respond asynchronously
      }
    });
  }
  
  async handleSaveToNotion(message) {
    try {
      // Get configuration
      const config = await browser.storage.local.get(['openaiKey', 'notionKey', 'notionDbId']);
      
      if (!config.openaiKey || !config.notionKey || !config.notionDbId) {
        throw new Error('Missing API configuration');
      }
      
      // Extract page content
      const pageContent = await this.extractPageContent(message.tabId);
      
      // Get existing tags from Notion
      const existingTags = await this.getNotionTags(config.notionKey, config.notionDbId);
      
      // Process content with OpenAI
      const aiResult = await this.processWithOpenAI(
        config.openaiKey,
        pageContent,
        existingTags
      );
      
      // Save to Notion
      await this.saveToNotion(
        config.notionKey,
        config.notionDbId,
        {
          title: message.title,
          url: message.url,
          extractedText: aiResult.extractedText,
          suggestedTags: aiResult.suggestedTags
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('Save to Notion error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async extractPageContent(tabId) {
    return new Promise((resolve, reject) => {
      browser.tabs.executeScript(tabId, {
        code: `
          // Extract main content from the page
          function extractContent() {
            // Remove script and style elements
            const scripts = document.querySelectorAll('script, style, nav, header, footer, aside');
            scripts.forEach(el => el.remove());
            
            // Try to find main content area
            let mainContent = document.querySelector('main, article, .content, .post, #content');
            if (!mainContent) {
              mainContent = document.body;
            }
            
            // Get text content and clean it up
            let text = mainContent.innerText || mainContent.textContent || '';
            
            // Clean up whitespace and formatting
            text = text.replace(/\\n\\s*\\n/g, '\\n\\n'); // Remove extra line breaks
            text = text.replace(/\\s+/g, ' '); // Normalize spaces
            text = text.trim();
            
            return text;
          }
          
          extractContent();
        `
      }, (result) => {
        if (browser.runtime.lastError) {
          reject(new Error(browser.runtime.lastError.message));
        } else {
          resolve(result[0] || '');
        }
      });
    });
  }
  
  async getNotionTags(notionKey, databaseId) {
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${notionKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Notion API error: ${response.status}`);
      }
      
      const database = await response.json();
      
      // Extract existing tags from the Tags property
      const tagsProperty = database.properties.Tags;
      if (tagsProperty && tagsProperty.type === 'multi_select') {
        return tagsProperty.multi_select.options.map(option => option.name);
      }
      
      return [];
    } catch (error) {
      console.error('Error getting Notion tags:', error);
      return [];
    }
  }
  
  async processWithOpenAI(apiKey, content, existingTags) {
    const prompt = `Analyze the following webpage content and:
1. Extract the main text, removing any unnecessary elements
2. Suggest up to 5 relevant tags from this list of existing tags: [${existingTags.join(', ')}]
3. Format the response as JSON:
{
    "extractedText": "...",
    "suggestedTags": ["tag1", "tag2", ...]
}

Webpage content:
${content.substring(0, 4000)}`; // Limit content length
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts and processes webpage content. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse JSON response
      try {
        return JSON.parse(aiResponse);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          extractedText: content.substring(0, 2000),
          suggestedTags: []
        };
      }
    } catch (error) {
      console.error('OpenAI processing error:', error);
      // Fallback to original content
      return {
        extractedText: content.substring(0, 2000),
        suggestedTags: []
      };
    }
  }
  
  async saveToNotion(notionKey, databaseId, data) {
    const pageData = {
      parent: {
        database_id: databaseId
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: data.title || 'Untitled'
              }
            }
          ]
        },
        URL: {
          url: data.url
        },
        Tags: {
          multi_select: data.suggestedTags.map(tag => ({ name: tag }))
        },
        Created: {
          date: {
            start: new Date().toISOString()
          }
        }
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: data.extractedText.substring(0, 2000) // Notion has limits
                }
              }
            ]
          }
        }
      ]
    };
    
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pageData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notion API error: ${errorData.message || response.status}`);
    }
    
    return await response.json();
  }
}

// Initialize background script
new WebToNotionBackground();
