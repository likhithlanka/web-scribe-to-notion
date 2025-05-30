import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookmarksDashboard from './BookmarksDashboard';
import LearningInsights from './LearningInsights';

const Index = () => {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="insights">Learning Insights</TabsTrigger>
      </TabsList>
      <TabsContent value="dashboard">
        <BookmarksDashboard />
      </TabsContent>
      <TabsContent value="insights">
        <LearningInsights />
      </TabsContent>
    </Tabs>
  );
};

export default Index;