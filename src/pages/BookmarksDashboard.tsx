import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, subMonths } from "date-fns";
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/components/StatsCard";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { TagDistributionChart } from "@/components/TagDistributionChart";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";

async function fetchBookmarksData() {
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from('bookmarks')
    .select(`
      id,
      title,
      url,
      created_at,
      main_tags (
        name
      ),
      bookmark_tags (
        tags (
          name
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (bookmarksError) throw bookmarksError;

  return bookmarks.map(bookmark => ({
    ...bookmark,
    mainTag: bookmark.main_tags?.name || 'Miscellaneous',
    tags: bookmark.bookmark_tags.map(bt => bt.tags.name)
  }));
}

export default function BookmarksDashboard() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState();
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedMainTag, setSelectedMainTag] = useState(null);

  useEffect(() => {
    fetchBookmarksData()
      .then(data => {
        setBookmarks(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const filteredArticles = useMemo(() => {
    return bookmarks.filter(bookmark => {
      const matchesSearch =
        bookmark.title.toLowerCase().includes(search.toLowerCase()) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
        bookmark.mainTag.toLowerCase().includes(search.toLowerCase());
      
      const matchesDate = !date || format(parseISO(bookmark.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      const matchesTag = !selectedTag || bookmark.tags.includes(selectedTag);
      const matchesMainTag = !selectedMainTag || bookmark.mainTag === selectedMainTag;
      
      return matchesSearch && matchesDate && matchesTag && matchesMainTag;
    });
  }, [bookmarks, search, date, selectedTag, selectedMainTag]);

  const tagDistribution = useMemo(() => {
    const counts = {};
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [bookmarks]);

  const timeSeriesData = useMemo(() => {
    const counts = {};
    bookmarks.forEach(bookmark => {
      const date = format(parseISO(bookmark.created_at), 'yyyy-MM-dd');
      counts[date] = (counts[date] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [bookmarks]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-200">
          Error: {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookmarks Dashboard</h1>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link to="/insights">View Learning Insights</Link>
          </Button>
          <Input
            placeholder="Search bookmarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tag Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <TagDistributionChart data={tagDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookmarks Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart data={timeSeriesData} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarHeatmap
              startDate={subMonths(new Date(), 12)}
              endDate={new Date()}
              values={timeSeriesData}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookmarks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-gray-500">Loading bookmarks...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Main Tag</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((bookmark) => (
                  <TableRow key={bookmark.id}>
                    <TableCell>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {bookmark.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setSelectedMainTag(bookmark.mainTag)}
                      >
                        {bookmark.mainTag}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {bookmark.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setSelectedTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(bookmark.created_at), 'PPP')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Link
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}