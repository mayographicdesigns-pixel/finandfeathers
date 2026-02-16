import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Organize videos by day of the week using uploaded promotional videos
const weeklyVideos = {
  0: [], // Sunday - no video provided
  1: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/72qd1ab8_Monday.mp4'], // Monday
  2: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/wvi3jxji_Tuesday.mp4'], // Tuesday
  3: [], // Wednesday - no video provided
  4: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/w9nk5dsp_Thursday.mp4'], // Thursday
  5: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/s5myd3mu_Friday.mp4'], // Friday
  6: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/lrdt4s1h_Saturday.mp4'] // Saturday
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
