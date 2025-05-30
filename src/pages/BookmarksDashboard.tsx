import React, { useEffect, useState, useMemo } from 'react';
import { Bar, Line } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

// Utility to fetch Notion data from your Supabase Edge Function
async function fetchNotionArticles() {
  try {
    const apiUrl = `${supabase.supabaseUrl}/functions/v1/list-notion-bookmarks`;
    const res = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Content-Type': 'application/json'
      },
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Failed to fetch Notion articles');
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.articles || [];
  } catch (err) {
    // Return empty array and let UI show error
    throw err;
  }
}

export default function BookmarksDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState<Date>();
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedMainTag, setSelectedMainTag] = useState(null);

  useEffect(() => {
    fetchNotionArticles()
      .then(data => {
        setArticles(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load data');
        setLoading(false);
      });
  }, []);

  // Filtered articles by search, date, and tag/mainTag
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch =
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content.toLowerCase().includes(search.toLowerCase()) ||
        (article.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
        (article.mainTag || '').toLowerCase().includes(search.toLowerCase());
      
      const matchesDate = !date || format(new Date(article.created), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      const matchesTag = !selectedTag || (article.tags || []).includes(selectedTag);
      const matchesMainTag = !selectedMainTag || article.mainTag === selectedMainTag;
      
      return matchesSearch && matchesDate && matchesTag && matchesMainTag;
    });
  }, [articles, search, date, selectedTag, selectedMainTag]);

  // Tag frequency for bar chart
  const tagData = useMemo(() => {
    const counts = {};
    articles.forEach(article => {
      (article.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [articles]);

  // MainTag frequency for bar chart
  const mainTagData = useMemo(() => {
    const counts = {};
    articles.forEach(article => {
      if (article.mainTag) {
        counts[article.mainTag] = (counts[article.mainTag] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [articles]);

  // Time series data
  const timeSeriesData = useMemo(() => {
    const data: Record<string, Record<string, number> & { date: string }> = {};
    articles.forEach(article => {
      const date = format(new Date(article.created), 'yyyy-MM-dd');
      if (!data[date]) {
        data[date] = { date };
      }
      if (article.mainTag) {
        data[date][article.mainTag] = (data[date][article.mainTag] || 0) + 1;
      }
    });
    return Object.values(data).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [articles]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tag Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar
                data={tagData}
                width={500}
                height={300}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                {/* Add Bar chart components here */}
              </Bar>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Main Tag Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar
                data={mainTagData}
                width={500}
                height={300}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                {/* Add Bar chart components here */}
              </Bar>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Reading Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line
                data={timeSeriesData}
                width={1000}
                height={300}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                {/* Add Line chart components here */}
              </Line>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bookmarks</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show loading state */}
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
                {filteredArticles.map((article) => (
                  <TableRow key={article.notionUrl}>
                    <TableCell>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {article.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setSelectedMainTag(article.mainTag)}
                      >
                        {article.mainTag}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {article.tags.map((tag) => (
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
                      {format(new Date(article.created), 'PPP')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={article.notionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Notion
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