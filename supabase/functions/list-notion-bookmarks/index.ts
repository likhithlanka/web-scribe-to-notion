import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function syncNotionToSupabase(notionKey: string, notionDbId: string, supabaseClient: any) {
  // First, clear existing data to prevent duplicates
  await supabaseClient.from('bookmark_tags').delete().neq('bookmark_id', null);
  await supabaseClient.from('bookmarks').delete().neq('id', null);
  
  // Fetch pages from Notion database
  const response = await fetch(`https://api.notion.com/v1/databases/${notionDbId}/query`, {
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
    throw new Error(`Notion API error: ${response.status}`);
  }

  const data = await response.json();
  const syncedBookmarks = [];
  
  // Process each bookmark
  for (const page of data.results) {
    const bookmark = {
      title: page.properties.Name?.title?.[0]?.plain_text || "",
      url: page.properties.URL?.url || "",
      main_tag: page.properties.MainTag?.select?.name || "Miscellaneous",
      tags: page.properties.Tags?.multi_select?.map((t: any) => t.name) || [],
      summarized_text: page.properties.SummarizedText?.rich_text?.[0]?.plain_text || "",
      type: "article",
      created_at: page.properties.Created?.date?.start || page.created_time
    };

    // 1. Get or create main tag
    const { data: mainTagData } = await supabaseClient
      .from('main_tags')
      .select('id')
      .eq('name', bookmark.main_tag)
      .single();

    const mainTagId = mainTagData?.id;

    // 2. Insert bookmark
    const { data: bookmarkData, error: bookmarkError } = await supabaseClient
      .from('bookmarks')
      .insert({
        title: bookmark.title,
        url: bookmark.url,
        main_tag_id: mainTagId,
        type: bookmark.type,
        summarized_text: bookmark.summarized_text,
        created_at: bookmark.created_at
      })
      .select('id')
      .single();

    if (bookmarkError) {
      console.error('Error inserting bookmark:', bookmarkError);
      continue;
    }

    // 3. Process tags
    for (const tagName of bookmark.tags) {
      // Get or create tag
      const { data: tagData } = await supabaseClient
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();

      let tagId = tagData?.id;

      if (!tagId) {
        const { data: newTag } = await supabaseClient
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
        tagId = newTag?.id;
      }

      // Create bookmark-tag relationship
      if (tagId) {
        await supabaseClient
          .from('bookmark_tags')
          .insert({
            bookmark_id: bookmarkData.id,
            tag_id: tagId
          });
      }
    }

    syncedBookmarks.push(bookmarkData.id);
  }

  return syncedBookmarks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const notionKey = Deno.env.get("NOTION_API_KEY");
    const notionDbId = Deno.env.get("NOTION_DB_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!notionKey || !notionDbId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const syncedBookmarks = await syncNotionToSupabase(notionKey, notionDbId, supabase);

    return new Response(JSON.stringify({ 
      success: true,
      message: `Successfully synced ${syncedBookmarks.length} bookmarks`,
      syncedBookmarks 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});