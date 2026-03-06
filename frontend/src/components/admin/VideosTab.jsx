import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit2, Trash2, Upload, RefreshCw, Video, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';

const VideosTab = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [uploadMode, setUploadMode] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    day_of_week: -1,
    is_common: false,
    display_order: 0
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: 'Error', description: 'Invalid file type. Allowed: MP4, WebM, MOV', variant: 'destructive' });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File too large. Maximum 50MB', variant: 'destructive' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile) return null;
    
    setUploading(true);
    setUploadProgress(10);
    
    try {
      const token = localStorage.getItem('adminToken');
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      
      setUploadProgress(30);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/upload/video`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });
      
      setUploadProgress(80);
      
      if (!response.ok) {
        throw new Error('Failed to upload video');
      }
      
      const result = await response.json();
      setUploadProgress(100);
      return result.url;
    } catch (error) {
      toast({ title: 'Upload Error', description: error.message, variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let videoUrl = formData.url;
    
    if (uploadMode === 'file' && selectedFile) {
      const uploadedUrl = await uploadVideo();
      if (!uploadedUrl) return;
      videoUrl = uploadedUrl;
    }
    
    if (!videoUrl) {
      toast({ title: 'Error', description: 'Please provide a video URL or upload a file', variant: 'destructive' });
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingVideo 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos/${editingVideo.id}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos`;
      
      const response = await fetch(url, {
        method: editingVideo ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, url: videoUrl })
      });
      
      if (response.ok) {
        toast({ title: 'Success', description: editingVideo ? 'Video updated' : 'Video created' });
        setShowForm(false);
        setEditingVideo(null);
        setSelectedFile(null);
        resetForm();
        fetchVideos();
      } else {
        throw new Error('Failed to save video');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || '',
      url: video.url || '',
      day_of_week: video.day_of_week ?? -1,
      is_common: video.is_common || false,
      display_order: video.display_order || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Delete this video?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos/${videoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Video deleted' });
        fetchVideos();
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (video) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/promo-videos/${video.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !video.is_active })
      });
      if (response.ok) {
        toast({ title: 'Success', description: `Video ${video.is_active ? 'hidden' : 'shown'}` });
        fetchVideos();
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ title: '', url: '', day_of_week: -1, is_common: false, display_order: 0 });
    setSelectedFile(null);
    setUploadMode('url');
  };

  if (loading) {
    return <div className="text-white text-center py-8">Loading videos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Promo Videos ({videos.length})</h2>
        <Button
          onClick={() => { resetForm(); setEditingVideo(null); setShowForm(true); }}
          className="bg-red-600 hover:bg-red-700"
          data-testid="add-video-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Video
        </Button>
      </div>

      {/* Video Form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingVideo ? 'Edit Video' : 'Add New Video'}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingVideo(null); setSelectedFile(null); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 block mb-1">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Monday Special Promo"
                  required
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              
              {/* Upload Mode Toggle */}
              <div>
                <label className="text-sm text-slate-300 block mb-2">Video Source</label>
                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    variant={uploadMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMode('url')}
                    className={uploadMode === 'url' ? 'bg-red-600' : ''}
                  >
                    URL Link
                  </Button>
                  <Button
                    type="button"
                    variant={uploadMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUploadMode('file')}
                    className={uploadMode === 'file' ? 'bg-red-600' : ''}
                  >
                    <Upload className="w-4 h-4 mr-1" /> Upload File
                  </Button>
                </div>
                
                {uploadMode === 'url' ? (
                  <Input
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://..."
                    required={uploadMode === 'url'}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/mov,video/quicktime"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-red-500 transition-colors"
                    >
                      {selectedFile ? (
                        <div className="text-white">
                          <Video className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="text-slate-400">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <p>Click to select video</p>
                          <p className="text-xs mt-1">MP4, WebM, MOV (max 50MB)</p>
                        </div>
                      )}
                    </div>
                    {uploading && (
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Day of Week</label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value), is_common: parseInt(e.target.value) === -1 ? formData.is_common : false })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded px-3 py-2"
                  >
                    <option value={-1}>All Days (Common)</option>
                    {dayNames.map((day, i) => (
                      <option key={i} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-1">Display Order</label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_common"
                  checked={formData.is_common}
                  onChange={(e) => setFormData({ ...formData, is_common: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_common" className="text-sm text-slate-300">
                  Common video (shows after day-specific videos)
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={uploading}>
                  {uploading ? 'Uploading...' : (editingVideo ? 'Update Video' : 'Create Video')}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingVideo(null); setSelectedFile(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      <div className="space-y-3">
        {videos.map((video) => (
          <Card key={video.id} className={`border-slate-700 ${video.is_active ? 'bg-slate-800/50' : 'bg-slate-800/20 opacity-60'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{video.title}</h3>
                  <p className="text-slate-400 text-sm truncate max-w-md">{video.url}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${video.is_common ? 'bg-blue-600' : 'bg-green-600'}`}>
                      {video.is_common ? 'Common' : dayNames[video.day_of_week] || 'All Days'}
                    </span>
                    <span className="text-xs text-slate-500">Order: {video.display_order}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleActive(video)}
                    className={video.is_active ? 'text-green-400' : 'text-slate-500'}
                  >
                    {video.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(video)} className="text-blue-400">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(video.id)} className="text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No promo videos yet. Add your first video!
        </div>
      )}
    </div>
  );
};

export default VideosTab;
