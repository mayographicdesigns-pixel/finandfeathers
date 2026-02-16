import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Update to current day on mount
    setCurrentDay(new Date().getDay());
  }, []);

  // Handle video loading and autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setShowPlayButton(false);

    const handleCanPlay = () => {
      setIsLoading(false);
      // Attempt to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented, show play button
          setShowPlayButton(true);
        });
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setShowPlayButton(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [currentDay, currentVideoIndex]);

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

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (video) {
      video.play();
      setShowPlayButton(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Day Selector */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {dayNames.map((day, index) => (
          <button
            key={index}
            onClick={() => changeDay(index)}
            data-testid={`day-btn-${day.toLowerCase()}`}
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
            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {/* Play Button Overlay */}
            {showPlayButton && !isLoading && (
              <button
                onClick={handlePlayClick}
                className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 cursor-pointer"
                data-testid="play-video-btn"
              >
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </div>
              </button>
            )}

            <video
              ref={videoRef}
              key={currentVideo}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              preload="auto"
              data-testid="promo-video"
            >
              <source src={currentVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Navigation Arrows */}
            {videos.length > 1 && (
              <>
                <button
                  onClick={prevVideo}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-300 z-20"
                  aria-label="Previous video"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextVideo}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-300 z-20"
                  aria-label="Next video"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Video Counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm z-20">
                  {currentVideoIndex + 1} / {videos.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No video available for {dayNames[currentDay]}
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
