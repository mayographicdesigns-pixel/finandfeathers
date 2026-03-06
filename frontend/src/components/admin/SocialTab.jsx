import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Upload, RefreshCw, Share2, ExternalLink, 
  Instagram, Facebook, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import { 
  getAdminSocialLinks, 
  createSocialLink, 
  updateSocialLink, 
  deleteSocialLink,
  getAdminInstagramPosts,
  createInstagramPost,
  deleteInstagramPost,
  uploadImage
} from '../../services/api';

const SocialTab = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [instagramPosts, setInstagramPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [linkForm, setLinkForm] = useState({ platform: 'instagram', url: '', username: '' });
  const [postForm, setPostForm] = useState({ instagram_url: '', caption: '', image_url: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [links, posts] = await Promise.all([
        getAdminSocialLinks(),
        getAdminInstagramPosts()
      ]);
      setSocialLinks(links);
      setInstagramPosts(posts);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    try {
      const newLink = await createSocialLink(linkForm);
      setSocialLinks([...socialLinks, newLink]);
      setShowLinkForm(false);
      setLinkForm({ platform: 'instagram', url: '', username: '' });
      toast({ title: 'Success', description: 'Social link added' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteLink = async (id) => {
    if (!window.confirm('Delete this social link?')) return;
    try {
      await deleteSocialLink(id);
      setSocialLinks(socialLinks.filter(l => l.id !== id));
      toast({ title: 'Success', description: 'Social link deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleLinkActive = async (link) => {
    try {
      await updateSocialLink(link.id, { is_active: !link.is_active });
      setSocialLinks(socialLinks.map(l => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(file);
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      setPostForm({ ...postForm, image_url: `${backendUrl}${result.url}` });
      toast({ title: 'Success', description: 'Image uploaded' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const newPost = await createInstagramPost(postForm);
      setInstagramPosts([...instagramPosts, newPost]);
      setShowPostForm(false);
      setPostForm({ instagram_url: '', caption: '', image_url: '' });
      toast({ title: 'Success', description: 'Instagram post added to feed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Remove this post from feed?')) return;
    try {
      await deleteInstagramPost(id);
      setInstagramPosts(instagramPosts.filter(p => p.id !== id));
      toast({ title: 'Success', description: 'Post removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const platformIcons = {
    instagram: Instagram,
    facebook: Facebook,
    tiktok: () => <span className="text-lg">🎵</span>,
    twitter: () => <span className="text-lg">𝕏</span>
  };

  const platformColors = {
    instagram: 'from-purple-600 to-pink-500',
    facebook: 'from-blue-600 to-blue-500',
    tiktok: 'from-black to-gray-800',
    twitter: 'from-gray-800 to-black'
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Social Links Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-red-500" />
            Social Media Links
          </h3>
          <Button onClick={() => setShowLinkForm(true)} className="bg-red-600 hover:bg-red-700" data-testid="add-social-link-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </Button>
        </div>

        {showLinkForm && (
          <Card className="bg-slate-800 border-slate-700 mb-4">
            <CardContent className="p-4">
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={linkForm.platform}
                    onChange={(e) => setLinkForm({ ...linkForm, platform: e.target.value })}
                    className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="twitter">Twitter/X</option>
                  </select>
                  <Input
                    placeholder="Username (e.g., @finandfeathers)"
                    value={linkForm.username}
                    onChange={(e) => setLinkForm({ ...linkForm, username: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                  />
                  <Input
                    placeholder="Full URL"
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">Save Link</Button>
                  <Button type="button" variant="outline" onClick={() => setShowLinkForm(false)} className="border-slate-600 text-slate-300">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {socialLinks.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              No social links added yet. Add your Instagram, Facebook, or TikTok links!
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {socialLinks.map((link) => {
              const Icon = platformIcons[link.platform] || ExternalLink;
              return (
                <Card key={link.id} className={`border ${link.is_active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${platformColors[link.platform]} flex items-center justify-center`}>
                        {typeof Icon === 'function' && Icon.prototype ? <Icon className="w-5 h-5 text-white" /> : <Icon />}
                      </div>
                      <div>
                        <p className="text-white font-medium capitalize">{link.platform}</p>
                        <p className="text-slate-400 text-sm">{link.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button size="sm" variant="ghost" onClick={() => handleToggleLinkActive(link)} className="text-slate-400">
                        {link.is_active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteLink(link.id)} className="text-red-400 hover:bg-red-900/30">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Instagram Feed Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Instagram className="w-5 h-5 text-pink-500" />
            Instagram Feed (Homepage)
          </h3>
          <Button onClick={() => setShowPostForm(true)} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600" data-testid="add-instagram-post-btn">
            <Plus className="w-4 h-4 mr-2" /> Add Post
          </Button>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Add Instagram posts to display on your homepage. You can paste the Instagram URL or upload an image directly.
        </p>

        {showPostForm && (
          <Card className="bg-slate-800 border-slate-700 mb-4">
            <CardContent className="p-4">
              <form onSubmit={handleCreatePost} className="space-y-4">
                <Input
                  placeholder="Instagram Post URL (e.g., https://instagram.com/p/...)"
                  value={postForm.instagram_url}
                  onChange={(e) => setPostForm({ ...postForm, instagram_url: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
                <Textarea
                  placeholder="Caption (optional)"
                  value={postForm.caption}
                  onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  rows={2}
                />
                <div>
                  <label className="text-slate-300 text-sm block mb-2">Image (upload or paste URL)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Image URL"
                      value={postForm.image_url}
                      onChange={(e) => setPostForm({ ...postForm, image_url: e.target.value })}
                      className="bg-slate-900 border-slate-700 text-white flex-1"
                    />
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="border-slate-600 text-slate-300">
                      {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                  </div>
                  {postForm.image_url && <img src={postForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded mt-2" />}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-500">Add to Feed</Button>
                  <Button type="button" variant="outline" onClick={() => setShowPostForm(false)} className="border-slate-600 text-slate-300">Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {instagramPosts.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center text-slate-400">
              No Instagram posts added yet. Add posts to show on your homepage!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {instagramPosts.map((post) => (
              <Card key={post.id} className="bg-slate-800/50 border-slate-700 overflow-hidden group">
                <div className="relative aspect-square">
                  {post.image_url ? (
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <Instagram className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {post.instagram_url && (
                      <a href={post.instagram_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </a>
                    )}
                    <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-red-500/80 rounded-full hover:bg-red-500">
                      <Trash2 className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                {post.caption && (
                  <CardContent className="p-2">
                    <p className="text-slate-300 text-xs truncate">{post.caption}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialTab;
