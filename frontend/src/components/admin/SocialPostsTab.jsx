import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { adminGetAllSocialPosts, adminDeleteSocialPost, adminCleanupOldPosts } from '../../services/api';

const SocialPostsTab = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const data = await adminGetAllSocialPosts();
      setPosts(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await adminDeleteSocialPost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      toast({ title: 'Success', description: 'Post deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm('Delete all posts older than 24 hours that don\'t have images?')) return;
    try {
      const result = await adminCleanupOldPosts();
      toast({ title: 'Cleanup Complete', description: `Deleted ${result.deleted_count} old posts` });
      fetchPosts();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const locations = [...new Set(posts.map(p => p.location_slug))].sort();

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === 'all' || post.location_slug === locationFilter;
    return matchesSearch && matchesLocation;
  });

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-500" />
            Social Posts / Comments
          </h3>
          <p className="text-slate-400 text-sm mt-1">{posts.length} total posts across all locations</p>
        </div>
        <Button onClick={handleCleanup} variant="outline" className="border-orange-600 text-orange-400 hover:bg-orange-900/30">
          <Trash2 className="w-4 h-4 mr-2" /> Cleanup Old Posts
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search posts or users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white w-64"
        />
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2"
        >
          <option value="all">All Locations</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-slate-400">
          With images: <span className="text-green-400">{posts.filter(p => p.image_url).length}</span>
        </span>
        <span className="text-slate-400">
          Without images: <span className="text-yellow-400">{posts.filter(p => !p.image_url).length}</span>
        </span>
        <span className="text-slate-400">
          Showing: <span className="text-white">{filteredPosts.length}</span>
        </span>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No posts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <Card key={post.id} className="bg-slate-800/50 border-slate-700" data-testid={`post-${post.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Author info */}
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{post.author_emoji || '😊'}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{post.author_name}</span>
                      <span className="text-slate-500 text-xs">@{post.location_slug}</span>
                      <span className="text-slate-500 text-xs">
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                      {post.image_url && (
                        <span className="px-2 py-0.5 bg-green-600/30 text-green-400 text-xs rounded">
                          Has Image
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-300 text-sm">{post.content}</p>
                    
                    {post.image_url && (
                      <img src={post.image_url} alt="" className="mt-2 max-w-xs max-h-32 rounded-lg border border-slate-700 object-cover" />
                    )}
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span>{post.likes || 0} likes</span>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(post.id)}
                    className="text-red-400 hover:bg-red-900/30 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialPostsTab;
