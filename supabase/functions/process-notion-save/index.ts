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
    
    // Save to Notion
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
  const prompt = `Analyze the following webpage content and:
1. Summarize the main ideas and key points of the page in a concise, markdown-formatted summary. The summary should be clear, well-structured, and capture the essence of the content, using headings, lists, bold, links, etc. as appropriate.
2. Suggest up to 5 relevant tags from this list of existing tags: [${existingTags.join(', ')}].
3. If no existing tags are relevant, you can suggest new tags that would be appropriate.
4. Format the response as JSON:
{
    "SummarizedText": "...", // SummarizedText should be a markdown-formatted summary of the page, not a copy of the original text, but a concise summary.
    "suggestedTags": ["tag1", "tag2", ...]
}
5. SummarizedText should simple, precise and give me the complete context. The summarized text should not be more than 200 words
Webpage content:
Title: ${content.title}
URL: ${content.url}
Domain: ${content.domain}
Word Count: ${content.wordCount}
Text: ${content.text.substring(0, 4000)}`;

  try {
    console.log('Sending request to OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes and processes webpage content. Always respond with valid JSON only, no additional text or formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
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
        SummarizedText: parsedResponse.SummarizedText || content.text.substring(0, 2000),
        suggestedTags: parsedResponse.suggestedTags || []
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return {
        SummarizedText: content.text.substring(0, 2000),
        suggestedTags: []
      };
    }
  } catch (error) {
    console.error('OpenAI processing error:', error);
    return {
      SummarizedText: content.text.substring(0, 2000),
      suggestedTags: []
    };
  }
}

async function saveToNotion(notionKey: string, databaseId: string, data: any) {
  // Compose a markdown summary with full details about the page
  const markdownSummary = `# ${data.title || 'Untitled'}

**URL:** [${data.url}](${data.url})

**Tags:** ${data.suggestedTags.join(', ')}

**Summary:**  
${data.SummarizedText}
`;

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
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: markdownSummary
              }
            }
          ]
        }
      }
    ]
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
