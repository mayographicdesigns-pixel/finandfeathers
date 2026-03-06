import React, { useState, useEffect } from 'react';
import { ImageUp, RefreshCw, Trash2, Eye, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { toast } from '../../hooks/use-toast';
import { adminGetGallerySubmissions, adminDeleteGallerySubmission } from '../../services/api';

const GallerySubmissionsTab = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await adminGetGallerySubmissions();
      setSubmissions(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this photo submission? This will also remove it from the public gallery.')) return;
    try {
      await adminDeleteGallerySubmission(id);
      setSubmissions(submissions.filter(s => s.id !== id));
      toast({ title: 'Success', description: 'Submission removed from gallery' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageUp className="w-5 h-5 text-red-500" />
            User Photo Submissions
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Photos submitted by users are auto-approved to the gallery. Remove inappropriate content here.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSubmissions} className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {submissions.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <ImageUp className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No user submissions yet</p>
            <p className="text-slate-500 text-sm">User-submitted photos will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map(submission => (
            <Card key={submission.id} className="bg-slate-800/50 border-slate-700 overflow-hidden" data-testid={`submission-${submission.id}`}>
              <div 
                className="aspect-video cursor-pointer group relative"
                onClick={() => setLightboxImage(submission)}
              >
                <img 
                  src={submission.image_url} 
                  alt={submission.caption || 'User submission'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-medium text-sm">{submission.user_name}</p>
                    {submission.caption && (
                      <p className="text-slate-400 text-xs line-clamp-2 mt-1">{submission.caption}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(submission.id)}
                    className="text-red-400 hover:bg-red-900/30 flex-shrink-0"
                    data-testid={`delete-submission-${submission.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage.image_url}
              alt={lightboxImage.caption || 'User submission'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{lightboxImage.user_name}</p>
              {lightboxImage.caption && <p className="text-slate-400 mt-1">{lightboxImage.caption}</p>}
              <p className="text-slate-500 text-sm mt-2">{new Date(lightboxImage.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GallerySubmissionsTab;
