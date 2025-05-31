import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function TopicWidget() {
  const [topic, setTopic] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopTopic() {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select(`
            main_tags (
              name
            )
          `);

        if (error) throw error;

        const counts = {};
        data.forEach(bookmark => {
          const tag = bookmark.main_tags?.name;
          if (tag) counts[tag] = (counts[tag] || 0) + 1;
        });

        const topTopic = Object.entries(counts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

        setTopic(topTopic);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTopTopic();
  }, []);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-none pb-2">
        <CardTitle className="text-lg sm:text-xl">Most Common Topic</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-center">{topic}</div>
        )}
      </CardContent>
    </Card>
  );
}