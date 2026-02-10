import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Organize videos by day of the week
const weeklyVideos = {
  0: ['/videos/1.mp4', '/videos/2.mp4', '/videos/3.mp4', '/videos/4.mp4'], // Sunday
  1: ['/videos/5.mp4', '/videos/6.mp4', '/videos/7.mp4', '/videos/8.mp4'], // Monday
  2: ['/videos/9.mp4', '/videos/10.mp4', '/videos/11.mp4', '/videos/12.mp4'], // Tuesday
  3: ['/videos/13.mp4', '/videos/14.mp4', '/videos/15.mp4', '/videos/16.mp4'], // Wednesday
  4: ['/videos/17.mp4', '/videos/18.mp4', '/videos/19.mp4', '/videos/20.mp4'], // Thursday
  5: ['/videos/21.mp4', '/videos/22.mp4', '/videos/23.mp4'], // Friday
  6: ['/videos/24.mp4', '/videos/25.mp4', '/videos/26.mp4', '/videos/27.mp4', '/videos/28.mp4', '/videos/29.mp4'] // Saturday
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DailyVideoCarousel = () => {
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    // Update to current day on mount
    setCurrentDay(new Date().getDay());
  }, []);

  const videos = weeklyVideos[currentDay] || [];
  const currentVideo = videos[currentVideoIndex];

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const changeDay = (day) => {
    setCurrentDay(day);
    setCurrentVideoIndex(0);
  };

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {dayNames.map((day, index) => (
          <button
            key={index}
            onClick={() => changeDay(index)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all duration-300 ${
              currentDay === index
                ? 'bg-red-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {day}
            {index === new Date().getDay() && (
              <span className="ml-2 text-xs">• Today</span>
            )}
          </button>
        ))}
      </div>

      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {currentVideo ? (
          <>
            <video
              key={currentVideo}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={currentVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Navigation Arrows */}
            {videos.length > 1 && (
              <>
                <button
                  onClick={prevVideo}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-300"
                  aria-label="Previous video"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextVideo}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-300"
                  aria-label="Next video"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Video Counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {currentVideoIndex + 1} / {videos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No videos available for this day
          </div>
        )}
      </div>

      {/* Video Dots Indicator */}
      {videos.length > 1 && (
        <div className="flex justify-center gap-2">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentVideoIndex
                  ? 'bg-red-500 w-8'
                  : 'bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyVideoCarousel;
