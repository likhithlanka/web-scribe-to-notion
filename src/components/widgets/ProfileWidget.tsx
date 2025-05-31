import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function ProfileWidget() {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/get-learning-insights`, {
          headers: {
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch insights');

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setInsights(data.insights.content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  return (
    <Card className="w-full h-full min-h-[12rem] flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle className="text-lg sm:text-xl">Likhith's Learning Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center overflow-y-auto">
        {loading ? (
          <div className="animate-pulse space-y-2 w-full">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="prose max-w-none w-full">
            <p className="text-base sm:text-lg leading-relaxed">{insights}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}