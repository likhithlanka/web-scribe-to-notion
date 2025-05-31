import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

export function ProfileWidget() {
  const [insights, setInsights] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
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
        setGeneratedAt(data.insights.generated_at);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  return (
    <Card className="w-full h-full flex flex-col bg-white dark:bg-[#191919] border-[#E9ECEF] dark:border-[#2F3437]">
      <CardHeader className="flex-none pb-2 px-6 pt-5">
        <CardTitle className="text-xl font-medium text-[#37352F] dark:text-[#E3E3E1] font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Apple Color Emoji',Arial,sans-serif,'Segoe UI Emoji','Segoe UI Symbol']">
          Likhith's Learning Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-6 pb-6 flex flex-col">
        {loading ? (
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-[#F1F3F5] dark:bg-[#2F3437] rounded-sm w-3/4 animate-pulse"></div>
            <div className="h-4 bg-[#F1F3F5] dark:bg-[#2F3437] rounded-sm w-full animate-pulse"></div>
            <div className="h-4 bg-[#F1F3F5] dark:bg-[#2F3437] rounded-sm w-2/3 animate-pulse"></div>
          </div>
        ) : error ? (
          <div className="text-[#EB5757] dark:text-[#FF6B6B] text-sm flex-1">{error}</div>
        ) : (
          <>
            <div className="prose prose-sm max-w-none dark:prose-invert flex-1">
              <p className="text-[15px] leading-[24px] text-[#37352F] dark:text-[#E3E3E1] font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Apple Color Emoji',Arial,sans-serif,'Segoe UI Emoji','Segoe UI Symbol']">
                {insights}
              </p>
            </div>
            {generatedAt && (
              <p className="text-xs text-[#9B9B9B] dark:text-[#9B9B9B] mt-4 font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,'Apple Color Emoji',Arial,sans-serif,'Segoe UI Emoji','Segoe UI Symbol']">
                Auto-generated on {format(new Date(generatedAt), 'MMMM d, yyyy')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}