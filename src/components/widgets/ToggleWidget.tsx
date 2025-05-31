import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActivityWidget } from "./ActivityWidget";
import { ProfileWidget } from "./ProfileWidget";
import { TopicWidget } from "./TopicWidget";
import { TotalBookmarksWidget } from "./TotalBookmarksWidget";
import { UniqueTagsWidget } from "./UniqueTagsWidget";

export function ToggleWidget() {
  const [currentView, setCurrentView] = useState<'activity' | 'profile'>('activity');

  return (
    <div className="w-full flex items-center justify-center">
      <Card className="w-full flex flex-col bg-white dark:bg-[#191919] border-[#E9ECEF] dark:border-[#2F3437] relative overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 left-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-50 hover:opacity-100 transition-opacity"
            onClick={() => setCurrentView('activity')}
            disabled={currentView === 'activity'}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="absolute top-1/2 -translate-y-1/2 right-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-50 hover:opacity-100 transition-opacity"
            onClick={() => setCurrentView('profile')}
            disabled={currentView === 'profile'}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative w-full overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${currentView === 'profile' ? '-50%' : '0'})`,
              width: '200%'
            }}
          >
            <div className="w-1/2 flex-shrink-0">
              <ActivityWidget />
            </div>
            <div className="w-1/2 flex-shrink-0">
              <div className="p-4 space-y-4">
                <ProfileWidget />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <TotalBookmarksWidget />
                  <UniqueTagsWidget />
                  <TopicWidget />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}