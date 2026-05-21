import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { getWeeklyVideos } from '../services/api';

// Universal special — shown first every day
const FF_SPECIALS_VIDEO = '/videos/ff-specials.mp4';

// Hardcoded fallback videos (used when no admin-managed videos exist)
const fallbackVideos = {
  0: [FF_SPECIALS_VIDEO, 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/xz8dxjvw_Saturday.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/i6rmsvxo_Hookah.mp4'],
  1: [FF_SPECIALS_VIDEO, 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/2s9dz5g6_Monday.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/rja5gk64_m-f%205%20specials.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/i6rmsvxo_Hookah.mp4'],
  2: [FF_SPECIALS_VIDEO, 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/v8ic00zl_Tuesday.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/rja5gk64_m-f%205%20specials.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/i6rmsvxo_Hookah.mp4'],
  3: [FF_SPECIALS_VIDEO, 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/zxeditdb_Wednesday.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/ae6sdud1_Wednesday%20%282%29.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/rja5gk64_m-f%205%20specials.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/i6rmsvxo_Hookah.mp4'],
  4: [FF_SPECIALS_VIDEO, 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/1rpx19mv_Thursday.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/rja5gk64_m-f%205%20specials.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/i6rmsvxo_Hookah.mp4'],
  5: [FF_SPECIALS_VIDEO, 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/5xyriiap_Friday.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/rja5gk64_m-f%205%20specials.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/i6rmsvxo_Hookah.mp4'],
  6: [FF_SPECIALS_VIDEO, 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/xz8dxjvw_Saturday.mp4', 'https://customer-assets.emergentagent.com/job_833cd44a-05b3-4d96-b7e3-c136122b70a4/artifacts/i6rmsvxo_Hookah.mp4']
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DailyVideoCarousel = () => {
  const [currentDay, setCurrentDay] = useState(new Date().getDay());
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [videoMap, setVideoMap] = useState(fallbackVideos);
  const videoRef = useRef(null);
  const dayScrollRef = useRef(null);

  // Fetch admin-managed videos, fall back to hardcoded
  useEffect(() => {
    const loadVideos = async () => {
      const data = await getWeeklyVideos();
      if (data && data.length > 0) {
        const merged = { ...fallbackVideos };
        data.forEach(entry => {
          if (entry.video_urls && entry.video_urls.length > 0) {
            // Always keep the F&F specials video at the top of every day
            const adminVids = entry.video_urls.filter(v => v !== FF_SPECIALS_VIDEO);
            merged[entry.day_index] = [FF_SPECIALS_VIDEO, ...adminVids];
          }
        });
        setVideoMap(merged);
      }
    };
    loadVideos();
  }, []);

  // Auto-scroll day selector to current day on mount
  useEffect(() => {
    if (dayScrollRef.current) {
      const todayBtn = dayScrollRef.current.querySelector(`[data-day="${currentDay}"]`);
      if (todayBtn) {
        todayBtn.scrollIntoView({ inline: 'center', behavior: 'smooth' });
      }
    }
  }, []);

  const videos = videoMap[currentDay] || [];
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
      <div ref={dayScrollRef} className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {dayNames.map((day, index) => (
          <button
            key={day}
            onClick={() => changeDay(index)}
            data-day={index}
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
              playsInline
              preload="auto"
              onEnded={nextVideo}
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
          {videos.map((v, index) => (
            <button
              key={v?.id || v?.url || `vid-dot-${index}`}
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
