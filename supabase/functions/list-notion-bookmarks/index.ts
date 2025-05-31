import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
async function syncNotionToSupabase(notionKey, notionDbId, supabaseClient) {
  // Get existing bookmark URLs to avoid duplicates
  const { data: existingBookmarks } = await supabaseClient.from('bookmarks').select('url, title');
  const existingUrls = new Set(existingBookmarks?.map((b)=>b.url) || []);
  const existingTitles = new Set(existingBookmarks?.map((b)=>b.title) || []);
  // First, fetch main tags from Notion database properties
  const dbResponse = await fetch(`https://api.notion.com/v1/databases/${notionDbId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${notionKey}`,
      "Notion-Version": "2022-06-28"
    }
  });
  if (!dbResponse.ok) {
    throw new Error(`Failed to fetch Notion database: ${dbResponse.status}`);
  }
  const dbData = await dbResponse.json();
  const mainTagOptions = dbData.properties.MainTag?.select?.options || [];
  // Sync main tags (upsert - only add new ones)
  for (const mainTag of mainTagOptions){
    await supabaseClient.from('main_tags').upsert({
      name: mainTag.name,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'name'
    });
  }
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
  const newBookmarks = [];
  let skippedBookmarks = 0;
  // Process each bookmark - only add new ones
  for (const page of data.results){
    const title = page.properties.Name?.title?.[0]?.plain_text || "";
    const url = page.properties.URL?.url || "";
    // Skip if bookmark already exists (check by URL or title)
    if (existingUrls.has(url) || existingTitles.has(title)) {
      skippedBookmarks++;
      console.log(`Skipping existing bookmark: ${title}`);
      continue;
    }
    // Get the correct creation time
    const createdTime = page.properties.Created?.date?.start || page.created_time;
    const bookmark = {
      title,
      url,
      main_tag: page.properties.MainTag?.select?.name || "Miscellaneous",
      tags: page.properties.Tags?.multi_select?.map((t)=>t.name) || [],
      summarized_text: page.properties.SummarizedText?.rich_text?.[0]?.plain_text || "",
      type: "article",
      created_at: createdTime,
      updated_at: page.last_edited_time
    };
    // Get main tag ID
    const { data: mainTagData } = await supabaseClient.from('main_tags').select('id').eq('name', bookmark.main_tag).single();
    if (!mainTagData) {
      console.warn(`Main tag "${bookmark.main_tag}" not found, using Miscellaneous`);
      const { data: miscTag } = await supabaseClient.from('main_tags').select('id').eq('name', 'Miscellaneous').single();
      bookmark.main_tag = 'Miscellaneous';
    }
    // Insert new bookmark
    const { data: bookmarkData, error: bookmarkError } = await supabaseClient.from('bookmarks').insert({
      title: bookmark.title,
      url: bookmark.url,
      main_tag_id: mainTagData?.id,
      type: bookmark.type,
      summarized_text: bookmark.summarized_text,
      created_at: bookmark.created_at,
      updated_at: bookmark.updated_at
    }).select('id').single();
    if (bookmarkError) {
      console.error('Error inserting bookmark:', bookmarkError);
      continue;
    }
    // Process tags for new bookmark
    for (const tagName of bookmark.tags){
      // Get or create tag (upsert)
      const { data: tagData } = await supabaseClient.from('tags').upsert({
        name: tagName,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'name'
      }).select('id').single();
      // Create bookmark-tag relationship
      if (tagData?.id) {
        await supabaseClient.from('bookmark_tags').insert({
          bookmark_id: bookmarkData.id,
          tag_id: tagData.id,
          created_at: bookmark.created_at
        });
      }
    }
    newBookmarks.push(bookmarkData.id);
  }
  return {
    newBookmarks,
    newCount: newBookmarks.length,
    skippedCount: skippedBookmarks,
    totalProcessed: data.results.length
  };
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
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
    const result = await syncNotionToSupabase(notionKey, notionDbId, supabase);
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${result.totalProcessed} bookmarks: ${result.newCount} new, ${result.skippedCount} skipped`,
      newBookmarks: result.newBookmarks,
      stats: {
        newCount: result.newCount,
        skippedCount: result.skippedCount,
        totalProcessed: result.totalProcessed
      }
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
