import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!openaiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch bookmarks with their tags
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('bookmarks')
      .select(`
        title,
        created_at,
        main_tags (name),
        bookmark_tags (tags (name))
      `)
      .order('created_at', { ascending: true });

    if (bookmarksError) throw bookmarksError;

    // Format bookmarks for the prompt
    const formattedBookmarks = bookmarks.map(bookmark => ({
      title: bookmark.title,
      date: bookmark.created_at,
      tags: [...bookmark.bookmark_tags.map(bt => bt.tags.name), bookmark.main_tags.name]
    }));

    const prompt = `Based on the following reading history, create a brief, impactful snapshot of Likhith's professional focus:

Reading Data:
${formattedBookmarks.map(b => `- "${b.title}" (${b.date}) [${b.tags.join(', ')}]`).join('\n')}

Format the response in two short parts:
1. Core Focus (1 line):
A punchy statement about primary expertise/interest

2. Current Exploration (1 line):
What's new or emerging in the learning journey

Keep each line under 15 words. Write for quick scanning, not detailed reading.

Example style:
"🎯 Product leader focused on strategic frameworks and team alignment methodologies.
🌱 Exploring AI's integration with fintech, emphasizing customer-centric innovation."`;

    // Get insights from OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert analyst creating concise, impactful professional focus summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    // Save insights to Supabase
    const { error: insightError } = await supabase
      .from('learning_insights')
      .upsert({
        id: 'latest',
        content: insights,
        generated_at: new Date().toISOString()
      });

    if (insightError) throw insightError;

    return new Response(JSON.stringify({ 
      success: true,
      insights
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