import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import CalendarHeatmap from 'react-calendar-heatmap';
import { subMonths, format, parseISO } from 'date-fns';
import 'react-calendar-heatmap/dist/styles.css';

export function ActivityWidget() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('created_at');

        if (error) throw error;

        const activityData = {};
        data.forEach(bookmark => {
          const date = format(parseISO(bookmark.created_at), 'yyyy-MM-dd');
          activityData[date] = (activityData[date] || 0) + 1;
        });

        const formattedActivity = Object.entries(activityData)
          .map(([date, count]) => ({ date, count }));

        setActivity(formattedActivity);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchActivity();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto bg-white">
      <CardHeader>
        <CardTitle>Learning Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <CalendarHeatmap
            startDate={subMonths(new Date(), 12)}
            endDate={new Date()}
            values={activity}
            classForValue={(value) => {
              if (!value) return 'color-empty';
              return `color-scale-${Math.min(value.count, 4)}`;
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}