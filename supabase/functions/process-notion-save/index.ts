import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, content, title, url, notionDbId } = await req.json();
    
    // Get API keys from environment
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const notionKey = Deno.env.get('NOTION_API_KEY');
    
    if (!openaiKey || !notionKey) {
      throw new Error('Missing API keys. Please configure OPENAI_API_KEY and NOTION_API_KEY in Supabase Edge Function Secrets.');
    }
    
    console.log('Processing content for user:', user.email);
    
    // Get existing tags from Notion database
    const existingTags = await getNotionTags(notionKey, notionDbId);
    console.log('Found existing tags:', existingTags);
    
    // Process content with OpenAI
    const aiResult = await processWithOpenAI(openaiKey, content, existingTags);
    console.log('AI processing complete:', aiResult);
    
    // Save to Notion with properly formatted blocks
    const notionResult = await saveToNotion(notionKey, notionDbId, {
      title,
      url,
      SummarizedText: aiResult.SummarizedText,
      suggestedTags: aiResult.suggestedTags
    });
    console.log('Saved to Notion:', notionResult.id);
    
    return new Response(JSON.stringify({ 
      success: true, 
      aiResult,
      notionResult,
      notionPageId: notionResult.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-notion-save function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getNotionTags(notionKey: string, databaseId: string) {
  try {
    console.log('Getting tags from Notion database:', databaseId);
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }
    
    const database = await response.json();
    
    const tagsProperty = database.properties.Tags;
    if (tagsProperty && tagsProperty.type === 'multi_select') {
      return tagsProperty.multi_select.options.map((option: any) => option.name);
    }
    
    return [];
  } catch (error) {
    console.error('Error getting Notion tags:', error);
    return [];
  }
}

async function processWithOpenAI(apiKey: string, content: any, existingTags: string[]) {
  const prompt = `You are an expert content summarizer. Analyze the following webpage and create a comprehensive yet concise summary.

Your task:
1. **Summarize the content** - Don't extract or copy the original text. Instead, create a well-structured markdown summary that captures the essence, main ideas, key insights, and important details of the webpage.

2. **Provide complete context** - The summary should give readers a full understanding of what the page is about, its purpose, main arguments, and key takeaways.

3. **Use proper markdown formatting** - Include headings (##), bullet points, **bold text** for emphasis, and other markdown elements to make it readable and well-structured.

4. **Keep it concise but comprehensive** - Maximum 200 words, but ensure all important information is captured.

5. **Suggest relevant tags** - Choose up to 5 tags from the existing list: [${existingTags.join(', ')}]. If none fit well, suggest new appropriate tags.

6. **Respond in valid JSON format only**:
{
    "SummarizedText": "## Main Topic\n\nYour markdown-formatted summary here...",
    "suggestedTags": ["tag1", "tag2", ...]
}

**Webpage to summarize:**
- Title: ${content.title}
- URL: ${content.url}
- Domain: ${content.domain}
- Original Content: ${content.text.substring(0, 4000)}

Remember: Create a summary that explains WHAT the page is about, WHY it matters, and WHAT the key insights are. Don't just extract or rephrase the original text.`;

  try {
    console.log('Sending request to OpenAI for summarization...');
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
            content: 'You are an expert content summarizer. Always respond with valid JSON only. Create concise but comprehensive summaries that give complete context about the content. Use proper markdown formatting for readability.'
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
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return {
        SummarizedText: parsedResponse.SummarizedText || `## ${content.title}\n\nFailed to generate summary. Please check the content and try again.`,
        suggestedTags: parsedResponse.suggestedTags || []
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw OpenAI response:', aiResponse);
      return {
        SummarizedText: `## ${content.title}\n\nFailed to parse AI summary. Raw content available on the source page.`,
        suggestedTags: []
      };
    }
  } catch (error) {
    console.error('OpenAI processing error:', error);
    return {
      SummarizedText: `## ${content.title}\n\nFailed to process content with AI. Please try again later.`,
      suggestedTags: []
    };
  }
}

async function saveToNotion(notionKey: string, databaseId: string, data: any) {
  // Convert markdown content into Notion blocks
  const blocks = convertMarkdownToNotionBlocks(data.SummarizedText);

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
        multi_select: data.suggestedTags.map((tag: string) => ({ name: tag }))
      },
      Created: {
        date: {
          start: new Date().toISOString()
        }
      },
      Type: {
        rich_text: [
          {
            text: {
              content: "Bookmarks"
            }
          }
        ]
      }
    },
    children: blocks
  };

  console.log('Saving to Notion with data:', JSON.stringify(pageData, null, 2));

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

function convertMarkdownToNotionBlocks(markdown: string) {
  const blocks: any[] = [];
  const lines = markdown.split('\n');
  
  let currentBlock: any = null;
  
  lines.forEach(line => {
    line = line.trim();
    if (!line) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      return;
    }

    // Handle headers
    if (line.startsWith('##')) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      const headerLevel = line.match(/^#{2,3}/)?.[0].length || 2;
      const text = line.replace(/^#{2,3}\s/, '');
      currentBlock = {
        object: 'block',
        type: headerLevel === 2 ? 'heading_2' : 'heading_3',
        [headerLevel === 2 ? 'heading_2' : 'heading_3']: {
          rich_text: [{
            type: 'text',
            text: { content: text }
          }]
        }
      };
      blocks.push(currentBlock);
      currentBlock = null;
      return;
    }

    // Handle bullet points
    if (line.startsWith('-')) {
      if (currentBlock) {
        blocks.push(currentBlock);
      }
      const text = line.replace(/^-\s/, '');
      currentBlock = {
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { 
              content: text.replace(/\*\*([^*]+)\*\*/g, '$1'),
            },
            annotations: {
              bold: text.includes('**')
            }
          }]
        }
      };
      blocks.push(currentBlock);
      currentBlock = null;
      return;
    }

    // Handle regular paragraphs
    if (!currentBlock) {
      currentBlock = {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { 
              content: line.replace(/\*\*([^*]+)\*\*/g, '$1'),
            },
            annotations: {
              bold: line.includes('**')
            }
          }]
        }
      };
    } else {
      currentBlock.paragraph.rich_text[0].text.content += '\n' + line;
    }
  });

  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks;
}
