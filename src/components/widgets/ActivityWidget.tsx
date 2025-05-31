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
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-none py-4">
        <CardTitle className="text-2xl font-semibold">Learning Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-4 pb-4">
        {loading ? (
          <div className="animate-pulse w-full h-32">
            <div className="h-full bg-gray-200 rounded"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="w-full h-full">
            <CalendarHeatmap
              startDate={subMonths(new Date(), 12)}
              endDate={new Date()}
              values={activity}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
              showWeekdayLabels={true}
              gutterSize={2}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { ActivityWidget }