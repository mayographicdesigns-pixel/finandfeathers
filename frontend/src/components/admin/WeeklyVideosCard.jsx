import React, { useState, useEffect } from 'react';
import { Video, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { adminGetWeeklyVideos, adminUpdateWeeklyVideos } from '../../services/api';

const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WeeklyVideosCard = () => {
  const [weeklyVideos, setWeeklyVideos] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminGetWeeklyVideos();
        const map = {};
        (data || []).forEach(entry => {
          map[entry.day_index] = entry.video_urls || [];
        });
        setWeeklyVideos(map);
      } catch {
        setWeeklyVideos({});
      }
    };
    load();
  }, []);

  const updateVideoUrl = (dayIndex, videoIndex, value) => {
    setWeeklyVideos(prev => {
      const urls = [...(prev[dayIndex] || [])];
      urls[videoIndex] = value;
      return { ...prev, [dayIndex]: urls };
    });
  };

  const addVideoToDay = (dayIndex) => {
    setWeeklyVideos(prev => ({
      ...prev,
      [dayIndex]: [...(prev[dayIndex] || []), '']
    }));
  };

  const removeVideoFromDay = (dayIndex, videoIndex) => {
    setWeeklyVideos(prev => ({
      ...prev,
      [dayIndex]: (prev[dayIndex] || []).filter((_, i) => i !== videoIndex)
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = dayLabels.map((_, i) => ({
        day_index: i,
        video_urls: (weeklyVideos[i] || []).filter(url => url.trim())
      }));
      await adminUpdateWeeklyVideos(payload);
      toast({ title: 'Success', description: 'Weekly promo videos updated' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-red-400" />
          Weekly Promo Videos
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Manage the video URLs shown in the homepage carousel for each day. Paste video URLs (mp4). Leave empty to use defaults.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {dayLabels.map((day, dayIndex) => (
          <div key={dayIndex} className="rounded-lg border border-slate-700/50 bg-slate-900/40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
              <span className="text-slate-300 font-semibold text-sm uppercase tracking-wider">{day}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addVideoToDay(dayIndex)}
                className="text-green-400 hover:bg-green-900/30 h-7 px-2"
                data-testid={`add-video-day-${dayIndex}`}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Video
              </Button>
            </div>
            <div className="p-3 space-y-2">
              {(weeklyVideos[dayIndex] || []).length === 0 && (
                <p className="text-slate-500 text-xs italic">Using default videos</p>
              )}
              {(weeklyVideos[dayIndex] || []).map((url, vi) => (
                <div key={vi} className="flex items-center gap-2">
                  <Input
                    value={url}
                    onChange={(e) => updateVideoUrl(dayIndex, vi, e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-sm flex-1"
                    placeholder="https://example.com/video.mp4"
                    data-testid={`video-url-${dayIndex}-${vi}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVideoFromDay(dayIndex, vi)}
                    className="text-red-400 hover:bg-red-900/30 h-8 w-8 p-0 shrink-0"
                    data-testid={`remove-video-${dayIndex}-${vi}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <Button
            onClick={save}
            className="bg-red-600 hover:bg-red-700"
            disabled={saving}
            data-testid="save-weekly-videos-btn"
          >
            {saving ? 'Saving...' : 'Save Weekly Videos'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyVideosCard;
