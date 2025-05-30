import "https://deno.land/x/xhr@0.1.0/mod.ts";
// @ts-ignore
Deno.env.set("SUPABASE_FUNCTIONS_VERIFY_JWT", "false");
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const notionKey = Deno.env.get("NOTION_API_KEY");
    const notionDbId = Deno.env.get("NOTION_DB_ID");
    if (!notionKey || !notionDbId) {
      throw new Error("Missing Notion API keys.");
    }

    // Fetch pages from Notion database with Type = Bookmarks filter
    const response = await fetch("https://api.notion.com/v1/databases/" + notionDbId + "/query", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 100,
        filter: {
          property: "Type",
          rich_text: {
            equals: "Bookmarks"
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const articles = data.results.map((page) => ({
      title: page.properties.Name?.title?.[0]?.plain_text || "",
      url: page.properties.URL?.url || "",
      tags: page.properties.Tags?.multi_select?.map((t) => t.name) || [],
      mainTag: page.properties.MainTag?.select?.name || "",
      created: page.properties.Created?.date?.start || page.created_time,
      content: page.properties.SummarizedText?.rich_text?.[0]?.plain_text || "",
      notionUrl: page.url,
    }));

    return new Response(JSON.stringify({ articles }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});