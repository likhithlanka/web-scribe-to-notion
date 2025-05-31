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
          .from('tags')
          .select('id', { count: 'exact', head: true });

        if (error) throw error;
        setCount(data?.length || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCount();
  }, []);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-none pb-2">
        <CardTitle className="text-lg sm:text-xl">Unique Tags</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="text-2xl sm:text-3xl md:text-4xl font-bold">{count}</div>
        )}
      </CardContent>
    </Card>
  );
}