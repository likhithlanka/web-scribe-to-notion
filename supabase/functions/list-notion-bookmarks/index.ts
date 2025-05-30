import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notionKey = Deno.env.get("NOTION_API_KEY");
    const notionDbId = Deno.env.get("NOTION_DB_ID");

    if (!notionKey || !notionDbId) {
      throw new Error("Missing required environment variables: NOTION_API_KEY or NOTION_DB_ID");
    }

    // Fetch all pages from Notion database
    const response = await fetch(`https://api.notion.com/v1/databases/${notionDbId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 100,
        sorts: [
          {
            property: "Created",
            direction: "descending"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Transform Notion pages into a cleaner format
    const articles = data.results.map((page: any) => ({
      id: page.id,
      title: page.properties.Name?.title?.[0]?.plain_text || "Untitled",
      url: page.properties.URL?.url || "",
      tags: page.properties.Tags?.multi_select?.map((t: any) => t.name) || [],
      mainTag: page.properties.MainTag?.select?.name || "",
      created: page.properties.Created?.date?.start || page.created_time,
      content: page.properties.SummarizedText?.rich_text?.[0]?.plain_text || "",
      notionUrl: page.url
    }));

    return new Response(JSON.stringify({ articles }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error in list-notion-bookmarks function:", error);
    
    return new Response(JSON.stringify({
      error: error.message || "Failed to fetch bookmarks"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});