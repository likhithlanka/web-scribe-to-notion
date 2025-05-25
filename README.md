
# Web to Notion Firefox Extension

A Firefox extension that processes webpage content through OpenAI's API and saves it to Notion with intelligent tagging.

## Features

- 🌐 Extract clean content from any webpage
- 🤖 AI-powered content processing with OpenAI
- 🏷️ Intelligent tag suggestions based on existing Notion tags
- 📝 Automatic saving to Notion database
- ⚙️ Secure API key management
- 🎨 Clean, modern popup interface

## Setup Instructions

### 1. Install the Extension

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from this directory

### 2. Set up Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration and copy the integration token
3. Create a database in Notion with these properties:
   - **Name** (Title)
   - **URL** (URL)
   - **Tags** (Multi-select)
   - **Created** (Date)
4. Share your database with your integration
5. Copy the database ID from the URL

### 3. Get OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Make sure you have credits available

### 4. Configure the Extension

1. Click the extension icon in Firefox toolbar
2. Click "⚙️ Configure API Keys"
3. Enter your:
   - OpenAI API Key
   - Notion Integration Token
   - Notion Database ID
4. Click "Save Configuration"

## Usage

1. Navigate to any webpage you want to save
2. Click the Web to Notion extension icon
3. Click "Save Current Page to Notion"
4. The extension will:
   - Extract the main content from the page
   - Process it through OpenAI to clean and tag it
   - Save it to your Notion database

## Privacy & Security

- API keys are stored locally in Firefox's secure storage
- No data is sent to external servers except OpenAI and Notion APIs
- Content extraction happens locally in your browser

## Troubleshooting

### Common Issues

1. **"Missing API configuration"**
   - Make sure all three API keys/IDs are configured
   - Verify the Notion database ID is correct

2. **"Notion API error"**
   - Check that your integration has access to the database
   - Verify the database has the required properties

3. **"OpenAI API error"**
   - Ensure your OpenAI API key is valid
   - Check that you have available credits

4. **Content extraction fails**
   - Some websites may block content extraction
   - Try refreshing the page and trying again

### Getting Database ID

The database ID is the 32-character string in your Notion database URL:
```
https://notion.so/workspace/DATABASE_ID?v=VIEW_ID
```

## Development

This extension uses:
- Manifest V2 for Firefox compatibility
- Modern JavaScript (ES6+)
- Firefox WebExtensions APIs
- OpenAI GPT-4o-mini model
- Notion API v2022-06-28

## License

MIT License - feel free to modify and distribute.
