import React, { useEffect, useState, useMemo } from 'react';
import { format } from "date-fns";
import ReactWordcloud from 'react-wordcloud';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend, ResponsiveContainer } from 'recharts';
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
    throw err;
  }
}

export default function BookmarksDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState();
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

  const wordCloudData = useMemo(() => {
    const counts = {};
    articles.forEach(article => {
      (article.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([text, value]) => ({ text, value }));
  }, [articles]);

  const heatmapData = useMemo(() => {
    const data = {};
    articles.forEach(article => {
      const date = format(new Date(article.created), 'yyyy-MM-dd');
      data[date] = (data[date] || 0) + 1;
    });
    return Object.entries(data).map(([date, count]) => ({ date, count }));
  }, [articles]);

  const knowledgeGraphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const tagMap = new Map();

    // Create nodes for each tag
    articles.forEach(article => {
      article.tags.forEach(tag => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            id: tag,
            name: tag,
            val: 1
          });
        } else {
          tagMap.get(tag).val++;
        }
      });

      // Create links between tags that appear together
      article.tags.forEach((tag1, i) => {
        article.tags.slice(i + 1).forEach(tag2 => {
          links.push({
            source: tag1,
            target: tag2,
            value: 1
          });
        });
      });
    });

    return {
      nodes: Array.from(tagMap.values()),
      links
    };
  }, [articles]);

  const stats = useMemo(() => ({
    totalArticles: articles.length,
    uniqueTags: new Set(articles.flatMap(a => a.tags)).size,
    avgTagsPerArticle: articles.reduce((acc, curr) => acc + curr.tags.length, 0) / articles.length || 0,
    mostUsedTag: Object.entries(
      articles.flatMap(a => a.tags)
        .reduce((acc, tag) => ({ ...acc, [tag]: (acc[tag] || 0) + 1 }), {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
  }), [articles]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-200">
          Error: {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Articles"
          value={stats.totalArticles}
        />
        <StatsCard
          title="Unique Tags"
          value={stats.uniqueTags}
        />
        <StatsCard
          title="Avg Tags/Article"
          value={stats.avgTagsPerArticle.toFixed(1)}
        />
        <StatsCard
          title="Most Used Tag"
          value={stats.mostUsedTag}
        />
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Knowledge Dashboard</h1>
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
            <CardTitle>Tag Cloud</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <ReactWordcloud
                words={wordCloudData}
                options={{
                  fontSizes: [12, 32],
                  rotations: 0,
                  fontFamily: 'Inter',
                  colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'],
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reading Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <CalendarHeatmap
                startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
                endDate={new Date()}
                values={heatmapData}
                classForValue={(value) => {
                  if (!value) return 'color-empty';
                  return `color-scale-${Math.min(value.count, 4)}`;
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Knowledge Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeGraph data={knowledgeGraphData} />
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