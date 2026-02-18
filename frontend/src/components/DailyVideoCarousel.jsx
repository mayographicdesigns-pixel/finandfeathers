import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Fallback videos in case API fails
const fallbackVideos = {
  0: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/gguqbaki_m-f%205%20specials.mp4'],
  1: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/72qd1ab8_Monday.mp4'],
  2: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/wvi3jxji_Tuesday.mp4'],
  3: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/d6juf8fz_Wednesday.mp4'],
  4: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/w9nk5dsp_Thursday.mp4'],
  5: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/s5myd3mu_Friday.mp4'],
  6: ['https://customer-assets.emergentagent.com/job_9c5c0528-00b8-4337-8ece-7b08da83da67/artifacts/lrdt4s1h_Saturday.mp4']
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DailyVideoCarousel = () => {
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [videosByDay, setVideosByDay] = useState(fallbackVideos);
  const videoRef = useRef(null);

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`${API_URL}/api/promo-videos`);
        if (response.ok) {
          const data = await response.json();
          
          // Organize videos by day
          const organized = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
          const commonVideos = [];
          
          data.forEach(video => {
            if (video.is_common) {
              commonVideos.push(video.url);
            } else if (video.day_of_week >= 0 && video.day_of_week <= 6) {
              organized[video.day_of_week].push(video.url);
            }
          });
          
          // Add common videos to each day
          for (let day = 0; day <= 6; day++) {
            organized[day] = [...organized[day], ...commonVideos];
            // Fallback if no videos for a day
            if (organized[day].length === 0) {
              organized[day] = fallbackVideos[day] || commonVideos;
            }
          }
          
          setVideosByDay(organized);
        }
      } catch (error) {
        console.error('Error fetching promo videos:', error);
        // Keep using fallback videos
      }
    };
    
    fetchVideos();
  }, []);

  const videos = videosByDay[currentDay] || [];
  const currentVideo = videos[currentVideoIndex];

  // Handle video loading and autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentVideo) return;

    setIsLoading(true);
    setShowPlayButton(false);

    const handleCanPlayThrough = () => {
      setIsLoading(false);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setShowPlayButton(true);
        });
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
      video.play().catch(() => {
        setShowPlayButton(true);
      });
    };

    const handleError = () => {
      setIsLoading(false);
      setShowPlayButton(true);
    };

    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setShowPlayButton(true);
    }, 10000);

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('error', handleError);

    video.load();

    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('error', handleError);
    };
  }, [currentVideo]);

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
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

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
              className="w-full h-full object-contain"
              muted
              loop
              playsInline
              preload="auto"
              data-testid="promo-video"
            >
              <source src={currentVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

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
