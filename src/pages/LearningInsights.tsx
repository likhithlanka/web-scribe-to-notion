import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { TagDistributionChart } from "@/components/TagDistributionChart";
import { supabase } from "@/integrations/supabase/client";
import CalendarHeatmap from 'react-calendar-heatmap';
import { format, parseISO, subMonths } from 'date-fns';
import 'react-calendar-heatmap/dist/styles.css';

export default function LearningInsights() {
  const [insights, setInsights] = useState<string>('');
  const [generatedAt, setGeneratedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBookmarks: 0,
    uniqueTags: 0,
    topMainTag: '',
    recentActivity: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch insights
        const insightsResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/get-learning-insights`, {
          headers: {
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!insightsResponse.ok) {
          throw new Error('Failed to fetch insights');
        }

        const insightsData = await insightsResponse.json();
        if (insightsData.error) throw new Error(insightsData.error);

        setInsights(insightsData.insights.content);
        setGeneratedAt(insightsData.insights.generated_at);

        // Fetch statistics
        const { data: bookmarks, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select(`
            id,
            created_at,
            main_tags (name),
            bookmark_tags (tags (name))
          `);

        if (bookmarksError) throw bookmarksError;

        // Calculate statistics
        const uniqueTags = new Set();
        const mainTagCounts = {};
        const activityData = {};

        bookmarks.forEach(bookmark => {
          // Count unique tags
          bookmark.bookmark_tags.forEach(bt => uniqueTags.add(bt.tags.name));
          
          // Count main tags
          const mainTag = bookmark.main_tags.name;
          mainTagCounts[mainTag] = (mainTagCounts[mainTag] || 0) + 1;

          // Group by date for activity heatmap
          const date = format(parseISO(bookmark.created_at), 'yyyy-MM-dd');
          activityData[date] = (activityData[date] || 0) + 1;
        });

        const topMainTag = Object.entries(mainTagCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

        setStats({
          totalBookmarks: bookmarks.length,
          uniqueTags: uniqueTags.size,
          topMainTag,
          recentActivity: Object.entries(activityData)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Learning Journey Insights</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Bookmarks"
          value={stats.totalBookmarks}
        />
        <StatsCard
          title="Unique Tags"
          value={stats.uniqueTags}
        />
        <StatsCard
          title="Most Common Topic"
          value={stats.topMainTag}
        />
        <StatsCard
          title="Active Days"
          value={Object.keys(stats.recentActivity).length}
        />
      </div>

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
              {generatedAt && (
                <p className="text-sm text-gray-500 mt-4">
                  Last updated: {new Date(generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarHeatmap
            startDate={subMonths(new Date(), 12)}
            endDate={new Date()}
            values={stats.recentActivity}
            classForValue={(value) => {
              if (!value) return 'color-empty';
              return `color-scale-${Math.min(value.count, 4)}`;
            }}
          />
          <div className="text-sm text-center text-gray-500 mt-2">
            Your learning activity over the past year
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 mt-4">
        These insights are automatically generated based on your reading history and updated daily.
      </div>
    </div>
  );
}