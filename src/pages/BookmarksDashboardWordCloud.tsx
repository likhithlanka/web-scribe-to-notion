import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import WordCloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

// Utility to fetch Notion data from your Supabase Edge Function
async function fetchNotionArticles() {
  const res = await fetch('https://ypkfdgvuipvfhktqqmpr.functions.supabase.co/list-notion-bookmarks');
  if (!res.ok) throw new Error('Failed to fetch Notion articles');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.articles || [];
}

export default function BookmarksDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

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

  // Tag frequency for word cloud
  const tagWords = useMemo(() => {
    const counts = {};
    articles.forEach(article => {
      (article.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([text, value]) => ({ text, value }));
  }, [articles]);

  // Filtered articles by search
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch =
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.content.toLowerCase().includes(search.toLowerCase()) ||
        (article.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
        (article.mainTag || '').toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [articles, search]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4 border border-red-200">
          Error: {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Bookmarks Dashboard</h1>
        <Input
          placeholder="Search bookmarks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tag Distribution (Word Cloud)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <WordCloud words={tagWords} options={{ fontSizes: [16, 48] }} />
          </div>
        </CardContent>
      </Card>
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
                      <Badge variant="secondary">{article.mainTag}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {article.tags.map((tag) => (
                          <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(article.created), 'PPP')}
                    </TableCell>
                    <TableCell>
                      <a
                        href={article.notionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 underline"
                      >
                        Open in Notion
                      </a>
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
