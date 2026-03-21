import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
  MessageCircle, Heart, Send, Image, Music, Megaphone, ArrowLeft,
  Settings, Users, Hash, Mail, MoreHorizontal, Trash2, X, Camera, Loader2, ChevronLeft
} from 'lucide-react';
import { locations } from '../mockData';

const API_URL = window.location.origin;

// ========== FEED TAB ==========
const FeedTab = ({ locationSlug, userId, userName, userAvatar }) => {
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wall/posts/${locationSlug}`);
      const data = await res.json();
      setPosts(data || []);
    } catch (e) { console.error(e); }
  }, [locationSlug]);

  useEffect(() => { fetchPosts(); const iv = setInterval(fetchPosts, 10000); return () => clearInterval(iv); }, [fetchPosts]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPostType('photo');
    }
  };

  const handlePost = async () => {
    if (!newContent.trim() && !imageFile) return;
    setPosting(true);
    try {
      let image_url = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const upRes = await fetch(`${API_URL}/api/wall/posts/upload-image`, { method: 'POST', body: formData });
        const upData = await upRes.json();
        image_url = upData.image_url;
      }
      await fetch(`${API_URL}/api/wall/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId, location_slug: locationSlug,
          user_name: userName, user_avatar: userAvatar,
          post_type: postType, content: newContent.trim(), image_url
        })
      });
      setNewContent(''); setImageFile(null); setImagePreview(null); setPostType('text');
      fetchPosts();
    } catch (e) { console.error(e); }
    finally { setPosting(false); }
  };

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`${API_URL}/api/wall/posts/${postId}/like`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await res.json();
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: data.action === 'liked' ? [...(p.likes || []), userId] : (p.likes || []).filter(l => l !== userId) } : p));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (postId) => {
    try {
      await fetch(`${API_URL}/api/wall/posts/${postId}?user_id=${userId}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) { console.error(e); }
  };

  const postTypeConfig = {
    text: { icon: MessageCircle, label: 'Post', color: 'text-slate-400' },
    photo: { icon: Camera, label: 'Photo', color: 'text-blue-400' },
    song_request: { icon: Music, label: 'Song', color: 'text-green-400' },
    shoutout: { icon: Megaphone, label: 'Shoutout', color: 'text-yellow-400' }
  };

  const timeAgo = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compose */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex gap-2 mb-2">
          {Object.entries(postTypeConfig).map(([type, cfg]) => (
            <button key={type} onClick={() => setPostType(type)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${postType === type ? 'bg-red-600/20 text-red-400 border border-red-600/40' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600'}`}
              data-testid={`post-type-${type}`}>
              <cfg.icon className="w-3 h-3" /> {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={newContent}
            onChange={e => setNewContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handlePost()}
            placeholder={postType === 'song_request' ? "What song are you vibing to?" : postType === 'shoutout' ? "Give someone a shoutout!" : "What's on your mind?"}
            className="bg-slate-800/60 border-slate-700 text-white text-sm flex-1"
            data-testid="post-input" />
          <input type="file" accept="image/*" ref={fileRef} onChange={handleImageSelect} className="hidden" />
          <Button onClick={() => fileRef.current?.click()} variant="ghost" className="text-slate-500 hover:text-blue-400 px-2" data-testid="post-image-btn">
            <Image className="w-4 h-4" />
          </Button>
          <Button onClick={handlePost} disabled={posting || (!newContent.trim() && !imageFile)}
            className="bg-red-600 hover:bg-red-700 text-white px-3" data-testid="post-submit-btn">
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        {imagePreview && (
          <div className="mt-2 relative inline-block">
            <img src={imagePreview} alt="preview" className="w-20 h-20 object-cover rounded-lg" />
            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1 -right-1 bg-red-600 rounded-full p-0.5">
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="feed-posts">
        {posts.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No posts yet. Be the first!</p>
          </div>
        )}
        {posts.map(post => {
          const cfg = postTypeConfig[post.post_type] || postTypeConfig.text;
          const isLiked = (post.likes || []).includes(userId);
          const isAuthor = post.user_id === userId;
          return (
            <Card key={post.id} className="bg-slate-900/80 border-slate-800" data-testid={`post-${post.id}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm shrink-0">
                    {post.user_avatar || '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{post.user_name}</span>
                      {post.post_type !== 'text' && (
                        <span className={`text-xs ${cfg.color} flex items-center gap-0.5`}>
                          <cfg.icon className="w-3 h-3" /> {cfg.label}
                        </span>
                      )}
                      <span className="text-slate-600 text-xs ml-auto shrink-0">{timeAgo(post.created_at)}</span>
                      {isAuthor && (
                        <button onClick={() => handleDelete(post.id)} className="text-slate-600 hover:text-red-400 ml-1" data-testid={`delete-post-${post.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{post.content}</p>
                    {post.image_url && (
                      <img src={post.image_url.startsWith('http') ? post.image_url : `${API_URL}${post.image_url}`} alt="" className="mt-2 rounded-lg max-h-64 object-cover w-full" />
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <button onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1 text-xs transition-colors ${isLiked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
                        data-testid={`like-post-${post.id}`}>
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        {(post.likes || []).length || ''}
                      </button>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {(post.comments || []).length || ''}
                      </span>
                    </div>
                    {/* Comments */}
                    {(post.comments || []).length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-slate-800 pt-2">
                        {(post.comments || []).slice(-3).map(c => (
                          <div key={c.id} className="flex items-start gap-1.5">
                            <span className="text-xs">{c.user_avatar || '👤'}</span>
                            <div>
                              <span className="text-slate-400 text-xs font-medium">{c.user_name}</span>
                              <span className="text-slate-400 text-xs ml-1">{c.content}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ========== CHAT TAB ==========
const ChatTab = ({ locationSlug, userId, userName, userAvatar }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wall/chat/${locationSlug}`);
      const data = await res.json();
      setMessages(data || []);
    } catch (e) { console.error(e); }
  }, [locationSlug]);

  useEffect(() => { fetchMessages(); const iv = setInterval(fetchMessages, 3000); return () => clearInterval(iv); }, [fetchMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/api/wall/chat/${locationSlug}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName, user_avatar: userAvatar, content: newMsg.trim() })
      });
      setNewMsg('');
      fetchMessages();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2" data-testid="chat-messages">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <Hash className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.user_id === userId;
          const showAvatar = i === 0 || messages[i - 1]?.user_id !== msg.user_id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-1.5 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                {showAvatar ? (
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs shrink-0">
                    {msg.user_avatar || '👤'}
                  </div>
                ) : <div className="w-6 shrink-0" />}
                <div>
                  {showAvatar && !isMe && (
                    <p className="text-slate-500 text-xs mb-0.5 px-1">{msg.user_name}</p>
                  )}
                  <div className={`px-3 py-1.5 rounded-2xl text-sm ${isMe ? 'bg-red-600/80 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-slate-800">
        <div className="flex gap-2">
          <Input value={newMsg} onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Message this location..."
            className="bg-slate-800/60 border-slate-700 text-white text-sm flex-1"
            data-testid="chat-input" />
          <Button onClick={handleSend} disabled={sending || !newMsg.trim()}
            className="bg-red-600 hover:bg-red-700 text-white px-3" data-testid="chat-send-btn">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ========== DMS TAB ==========
const DMsTab = ({ userId, userName, userAvatar, locationSlug }) => {
  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [locationUsers, setLocationUsers] = useState([]);
  const bottomRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/wall/dm/conversations/${userId}`);
      const data = await res.json();
      setConversations(data || []);
    } catch (e) { console.error(e); }
  }, [userId]);

  useEffect(() => { fetchConversations(); const iv = setInterval(fetchConversations, 5000); return () => clearInterval(iv); }, [fetchConversations]);

  const openThread = async (partnerId, partnerName) => {
    setActiveThread({ id: partnerId, name: partnerName });
    try {
      const res = await fetch(`${API_URL}/api/wall/dm/thread/${userId}/${partnerId}`);
      const data = await res.json();
      setThreadMessages(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchThread = useCallback(async () => {
    if (!activeThread) return;
    try {
      const res = await fetch(`${API_URL}/api/wall/dm/thread/${userId}/${activeThread.id}`);
      const data = await res.json();
      setThreadMessages(data || []);
    } catch (e) { console.error(e); }
  }, [activeThread, userId]);

  useEffect(() => { if (activeThread) { const iv = setInterval(fetchThread, 3000); return () => clearInterval(iv); } }, [activeThread, fetchThread]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [threadMessages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeThread) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/api/wall/dm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_user_id: userId, from_user_name: userName, from_user_avatar: userAvatar,
          to_user_id: activeThread.id, to_user_name: activeThread.name,
          content: newMsg.trim()
        })
      });
      setNewMsg('');
      fetchThread();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const fetchLocationUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/wall/users/${locationSlug}`);
      const data = await res.json();
      setLocationUsers((data || []).filter(u => u.user_id !== userId));
    } catch (e) { console.error(e); }
  };

  const startNewDM = (user) => {
    setShowNewDM(false);
    openThread(user.user_id, user.user_name);
  };

  // Thread view
  if (activeThread) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-3 border-b border-slate-800">
          <button onClick={() => { setActiveThread(null); fetchConversations(); }} className="text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium text-sm">{activeThread.name}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2" data-testid="dm-thread">
          {threadMessages.map(msg => {
            const isMe = msg.from_user_id === userId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-1.5 rounded-2xl text-sm max-w-[80%] ${isMe ? 'bg-red-600/80 text-white rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-slate-800">
          <div className="flex gap-2">
            <Input value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${activeThread.name}...`}
              className="bg-slate-800/60 border-slate-700 text-white text-sm flex-1"
              data-testid="dm-input" />
            <Button onClick={handleSend} disabled={sending || !newMsg.trim()}
              className="bg-red-600 hover:bg-red-700 text-white px-3" data-testid="dm-send-btn">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <span className="text-white font-medium text-sm">Messages</span>
        <Button onClick={() => { setShowNewDM(true); fetchLocationUsers(); }}
          variant="ghost" className="text-red-400 hover:text-red-300 text-xs h-7 px-2" data-testid="new-dm-btn">
          <Users className="w-3.5 h-3.5 mr-1" /> New
        </Button>
      </div>

      {showNewDM && (
        <div className="p-3 bg-slate-800/50 border-b border-slate-700">
          <p className="text-slate-400 text-xs mb-2">People at this location:</p>
          {locationUsers.length === 0 ? (
            <p className="text-slate-600 text-xs">No other users found at this location yet.</p>
          ) : (
            <div className="space-y-1">
              {locationUsers.map(u => (
                <button key={u.user_id} onClick={() => startNewDM(u)}
                  className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-slate-700 transition-colors" data-testid={`dm-user-${u.user_id}`}>
                  <span className="text-sm">{u.user_avatar || '👤'}</span>
                  <span className="text-white text-sm">{u.user_name}</span>
                </button>
              ))}
            </div>
          )}
          <Button onClick={() => setShowNewDM(false)} variant="ghost" className="text-slate-500 text-xs mt-2 w-full h-7">Cancel</Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" data-testid="dm-conversations">
        {conversations.length === 0 && !showNewDM && (
          <div className="text-center text-slate-500 py-12">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-slate-600 mt-1">Start one by tapping "New" above</p>
          </div>
        )}
        {conversations.map(conv => (
          <button key={conv.partner_id} onClick={() => openThread(conv.partner_id, conv.partner_name)}
            className="flex items-center gap-3 w-full p-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors text-left"
            data-testid={`conv-${conv.partner_id}`}>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm shrink-0">
              {conv.partner_avatar || '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-medium truncate">{conv.partner_name}</span>
                {conv.unread > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{conv.unread}</span>
                )}
              </div>
              <p className="text-slate-500 text-xs truncate">{conv.last_message}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ========== MAIN SOCIAL WALL PAGE ==========
const SocialWallPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('feed');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadDMs, setUnreadDMs] = useState(0);

  const location = locations.find(l => l.slug === slug);
  const locationName = location?.name?.replace('Fin & Feathers - ', '') || slug;

  useEffect(() => {
    const loadProfile = async () => {
      const profileId = localStorage.getItem('ff_user_profile_id');
      if (!profileId) { navigate('/account'); return; }
      try {
        const res = await fetch(`${API_URL}/api/user/profile/${profileId}`);
        if (!res.ok) { navigate('/account'); return; }
        const data = await res.json();
        setUserProfile(data);
      } catch { navigate('/account'); }
      finally { setLoading(false); }
    };
    loadProfile();
  }, [navigate]);

  // Fetch unread DM count
  useEffect(() => {
    if (!userProfile) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`${API_URL}/api/wall/dm/unread/${userProfile.id}`);
        const data = await res.json();
        setUnreadDMs(data.unread || 0);
      } catch {}
    };
    fetchUnread();
    const iv = setInterval(fetchUnread, 10000);
    return () => clearInterval(iv);
  }, [userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const userId = userProfile?.id;
  const userName = userProfile?.name || 'Anonymous';
  const userAvatar = userProfile?.avatar_emoji || '👤';

  const tabs = [
    { id: 'feed', label: 'Feed', icon: MessageCircle },
    { id: 'chat', label: 'Chat', icon: Hash },
    { id: 'dms', label: 'DMs', icon: Mail, badge: unreadDMs }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" data-testid="social-wall-page">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">{locationName}</h1>
              <p className="text-slate-500 text-xs">Social Wall</p>
            </div>
          </div>
          <button onClick={() => navigate('/account')} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-red-600/50 transition-colors" data-testid="settings-btn">
            <Settings className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-950 border-b border-slate-800 px-4">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium relative transition-colors ${activeTab === tab.id ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
              data-testid={`tab-${tab.id}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-red-600 text-white text-[10px] rounded-full px-1 min-w-[14px] text-center leading-[14px]">{tab.badge}</span>
              )}
              {activeTab === tab.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-red-500 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full flex flex-col overflow-hidden">
        {activeTab === 'feed' && <FeedTab locationSlug={slug} userId={userId} userName={userName} userAvatar={userAvatar} />}
        {activeTab === 'chat' && <ChatTab locationSlug={slug} userId={userId} userName={userName} userAvatar={userAvatar} />}
        {activeTab === 'dms' && <DMsTab userId={userId} userName={userName} userAvatar={userAvatar} locationSlug={slug} />}
      </div>
    </div>
  );
};

export default SocialWallPage;
