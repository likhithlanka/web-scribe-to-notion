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
    <Card className="w-full h-full flex flex-col bg-white dark:bg-[#191919] border-[#E9ECEF] dark:border-[#2F3437]">
      <CardHeader className="flex-none pb-2 px-6 pt-5">
        <CardTitle className="text-lg font-medium text-[#37352F] dark:text-[#E3E3E1] font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Apple Color Emoji',Arial,sans-serif,'Segoe UI Emoji','Segoe UI Symbol']">
          Most Common Topic
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-6 pb-6 flex items-center justify-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-[#F1F3F5] dark:bg-[#2F3437] rounded w-32"></div>
          </div>
        ) : error ? (
          <div className="text-[#EB5757] dark:text-[#FF6B6B] text-sm">{error}</div>
        ) : (
          <div className="text-2xl font-bold text-center text-[#37352F] dark:text-[#E3E3E1] font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Apple Color Emoji',Arial,sans-serif,'Segoe UI Emoji','Segoe UI Symbol']">
            {topic}
          </div>
        )}
      </CardContent>
    </Card>
  );
}