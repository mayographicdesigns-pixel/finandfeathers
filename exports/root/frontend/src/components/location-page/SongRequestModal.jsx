import React, { useState } from 'react';
import { X, Music, Mic2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';

const SongRequestModal = ({
  isOpen,
  onClose,
  requestType, // 'karaoke' or 'song_request'
  djName,
  locationSlug,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    name: '',
    song: '',
    artist: ''
  });

  if (!isOpen) return null;

  const isKaraoke = requestType === 'karaoke';
  const title = isKaraoke ? 'Karaoke Sign Up' : 'Request a Song';
  const icon = isKaraoke ? <Mic2 className="w-5 h-5" /> : <Music className="w-5 h-5" />;
  const accentColor = isKaraoke ? 'pink' : 'purple';
  const buttonText = isKaraoke ? 'Sign Up for Karaoke' : 'Submit Song Request';

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.song.trim()) {
      return;
    }
    onSubmit({
      ...formData,
      type: requestType,
      location_slug: locationSlug
    });
  };

  const handleClose = () => {
    setFormData({ name: '', song: '', artist: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className={`bg-slate-900 border-${accentColor}-600/50 w-full max-w-md`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-${accentColor}-600/20 flex items-center justify-center text-${accentColor}-400`}>
                {icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                {djName && (
                  <p className="text-slate-400 text-sm">To: DJ {djName}</p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose} 
              className="text-slate-400 hover:text-white"
              data-testid="close-song-request-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Your Name *
              </label>
              <Input
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                maxLength={50}
                data-testid="song-request-name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Song Title *
              </label>
              <Input
                placeholder="Enter song title"
                value={formData.song}
                onChange={(e) => setFormData({ ...formData, song: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                maxLength={100}
                data-testid="song-request-song"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Artist (Optional)
              </label>
              <Input
                placeholder="Enter artist name"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                maxLength={100}
                data-testid="song-request-artist"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.song.trim()}
            className={`w-full mt-6 h-12 text-lg ${
              isKaraoke 
                ? 'bg-pink-600 hover:bg-pink-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
            data-testid="submit-song-request"
          >
            {isSubmitting ? 'Submitting...' : buttonText}
          </Button>

          <p className="text-slate-500 text-xs text-center mt-3">
            {isKaraoke 
              ? 'The DJ will call your name when it\'s your turn!'
              : 'The DJ will try to play your request soon!'
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SongRequestModal;
