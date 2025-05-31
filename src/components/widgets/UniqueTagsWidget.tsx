import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function UniqueTagsWidget() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCount() {
      try {
        const { data, error } = await supabase
          .from('bookmark_tags')
          .select('tag_id', { count: 'exact', head: false });

        if (error) throw error;
        
        // Count unique tag IDs
        const uniqueTags = new Set(data.map(bt => bt.tag_id));
        setCount(uniqueTags.size);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCount();
  }, []);

  return (
    <Card className="w-full flex flex-col bg-white dark:bg-[#191919] border-[#E9ECEF] dark:border-[#2F3437]">
      <CardHeader className="flex-none py-3 px-4">
        <CardTitle className="text-sm font-medium text-[#37352F] dark:text-[#E3E3E1] font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Apple Color Emoji',Arial,sans-serif,'Segoe UI Emoji','Segoe UI Symbol']">
          Unique Tags
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-4">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-[#F1F3F5] dark:bg-[#2F3437] rounded w-16"></div>
          </div>
        ) : error ? (
          <div className="text-[#EB5757] dark:text-[#FF6B6B] text-xs">{error}</div>
        ) : (
          <div className="text-2xl font-bold text-[#37352F] dark:text-[#E3E3E1] font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Apple Color Emoji',Arial,sans-serif,'Segoe UI Emoji','Segoe UI Symbol']">
            {count}
          </div>
        )}
      </CardContent>
    </Card>
  );
}