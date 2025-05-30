import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export default function LearningInsights() {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const { data, error } = await supabase
          .from('learning_insights')
          .select('content, generated_at')
          .eq('id', 'latest')
          .single();

        if (error) throw error;
        setInsights(data.content);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Learning Journey Insights</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Learning Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : error ? (
            <div className="text-red-500">Error: {error}</div>
          ) : (
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed">{insights}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 text-sm text-gray-500">
        This insight is automatically generated based on your reading history and updated daily.
      </div>
    </div>
  );
}