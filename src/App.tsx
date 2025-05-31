import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BookmarksDashboard from "./pages/BookmarksDashboard";
import LearningInsights from "./pages/LearningInsights";
import NotFound from "./pages/NotFound";
import TotalBookmarksPage from "./pages/widgets/total-bookmarks";
import UniqueTagsPage from "./pages/widgets/unique-tags";
import TopicPage from "./pages/widgets/topic";
import ActivityPage from "./pages/widgets/activity";
import ProfilePage from "./pages/widgets/profile";
import TogglePage from "./pages/widgets/toggle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BookmarksDashboard />} />
          <Route path="/insights" element={<LearningInsights />} />
          <Route path="/widgets/total-bookmarks" element={<TotalBookmarksPage />} />
          <Route path="/widgets/unique-tags" element={<UniqueTagsPage />} />
          <Route path="/widgets/topic" element={<TopicPage />} />
          <Route path="/widgets/activity" element={<ActivityPage />} />
          <Route path="/widgets/profile" element={<ProfilePage />} />
          <Route path="/widgets/toggle" element={<TogglePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);