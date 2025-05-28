import React, { useEffect, useState, useMemo } from 'react';
import { Table, Input, DatePicker, Card } from 'antd';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';

// Utility to fetch Notion data from your own API endpoint
async function fetchNotionArticles() {
  // Replace with your own API endpoint that proxies Notion DB data
  const res = await fetch('/api/notion-articles');
  if (!res.ok) throw new Error('Failed to fetch Notion articles');
  return res.json();
}

export default function NotionBookmarksDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedMainTag, setSelectedMainTag] = useState(null);

  useEffect(() => {
    fetchNotionArticles().then(data => {
      setArticles(data);
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
      const matchesDate =
        (!dateRange[0] || new Date(article.created) >= dateRange[0]) &&
        (!dateRange[1] || new Date(article.created) <= dateRange[1]);
      const matchesTag = selectedTag ? (article.tags || []).includes(selectedTag) : true;
      const matchesMainTag = selectedMainTag ? article.mainTag === selectedMainTag : true;
      return matchesSearch && matchesDate && matchesTag && matchesMainTag;
    });
  }, [articles, search, dateRange, selectedTag, selectedMainTag]);

  // Tag frequency for bar chart
  const tagCounts = useMemo(() => {
    const counts = {};
    articles.forEach(article => {
      (article.tags || []).forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [articles]);

  // MainTag frequency for bar chart
  const mainTagCounts = useMemo(() => {
    const counts = {};
    articles.forEach(article => {
      if (article.mainTag) counts[article.mainTag] = (counts[article.mainTag] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Time series for main tags
  const mainTagTimeSeries = useMemo(() => {
    const series = {};
    articles.forEach(article => {
      const date = article.created.slice(0, 10); // YYYY-MM-DD
      if (!series[article.mainTag]) series[article.mainTag] = {};
      series[article.mainTag][date] = (series[article.mainTag][date] || 0) + 1;
    });
    return series;
  }, [articles]);

  // Table columns
  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      render: (text, record) => <a href={record.url} target="_blank" rel="noopener noreferrer">{text}</a>,
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Main Tag',
      dataIndex: 'mainTag',
      render: tag => <a onClick={() => setSelectedMainTag(tag)}>{tag}</a>,
      filters: Object.keys(mainTagCounts).map(tag => ({ text: tag, value: tag })),
      onFilter: (value, record) => record.mainTag === value,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      render: tags => tags.map(tag => <a key={tag} onClick={() => setSelectedTag(tag)} style={{ marginRight: 4 }}>{tag}</a>),
    },
    {
      title: 'Created',
      dataIndex: 'created',
      sorter: (a, b) => new Date(a.created) - new Date(b.created),
    },
    {
      title: 'Summary',
      dataIndex: 'content',
      render: text => <span style={{ maxWidth: 300, display: 'inline-block', whiteSpace: 'pre-line' }}>{text}</span>,
    },
    {
      title: 'Notion',
      dataIndex: 'notionUrl',
      render: url => <a href={url} target="_blank" rel="noopener noreferrer">Open</a>,
    },
  ];

  // Bar chart data for tags
  const tagBarData = {
    labels: Object.keys(tagCounts),
    datasets: [{
      label: 'Tag Frequency',
      data: Object.values(tagCounts),
      backgroundColor: '#69c0ff',
    }],
  };

  // Bar chart data for main tags
  const mainTagBarData = {
    labels: Object.keys(mainTagCounts),
    datasets: [{
      label: 'Main Tag Frequency',
      data: Object.values(mainTagCounts),
      backgroundColor: '#b37feb',
    }],
  };

  // Line chart for main tag trends
  const dates = Array.from(new Set(articles.map(a => a.created.slice(0, 10)))).sort();
  const mainTagLineData = {
    labels: dates,
    datasets: Object.keys(mainTagTimeSeries).map(tag => ({
      label: tag,
      data: dates.map(date => mainTagTimeSeries[tag][date] || 0),
      fill: false,
      borderColor: '#' + Math.floor(Math.random()*16777215).toString(16),
    })),
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Bookmarks Dashboard</h1>
      <Card style={{ marginBottom: 24 }}>
        <Bar data={tagBarData} options={{ onClick: (e, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            setSelectedTag(tagBarData.labels[idx]);
          }
        }}} />
        <Bar data={mainTagBarData} options={{ onClick: (e, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            setSelectedMainTag(mainTagBarData.labels[idx]);
          }
        }}} />
        <Line data={mainTagLineData} />
      </Card>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Input.Search
          placeholder="Search articles..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <DatePicker.RangePicker
          onChange={dates => setDateRange(dates)}
        />
        {(selectedTag || selectedMainTag) && (
          <a onClick={() => { setSelectedTag(null); setSelectedMainTag(null); }}>Clear Tag Filter</a>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={filteredArticles}
        loading={loading}
        rowKey={record => record.notionUrl}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
