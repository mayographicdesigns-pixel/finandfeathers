import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import {
  MessageCircle, Heart, Send, Image, Music, Megaphone, ArrowLeft,
  Settings, Users, Hash, Mail, MoreHorizontal, Trash2, X, Camera, Loader2, ChevronLeft, Bell,
  Radio, Calendar, Clock, Mic2, Video
} from 'lucide-react';
import { locations } from '../mockData';

const API_URL = window.location.origin;

// ========== FEED TAB ==========
const FeedTab = ({ locationSlug, userId, userName, userAvatar, djStatus }) => {
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState('');
  const [postType, setPostType] = useState('text');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);

  const isDJLive = djStatus?.is_live || djStatus?.karaoke_active;

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

  // All post type configs for display (always show icon for existing posts)
  const allPostTypes = {
    text: { icon: MessageCircle, label: 'Post', color: 'text-slate-400' },
    photo: { icon: Camera, label: 'Photo', color: 'text-blue-400' },
    song_request: { icon: Music, label: 'Song', color: 'text-green-400' },
    shoutout: { icon: Megaphone, label: 'Shoutout', color: 'text-yellow-400' }
  };

  // Compose buttons — hide song_request when no DJ/karaoke active
  const postTypeConfig = {
    text: allPostTypes.text,
    photo: allPostTypes.photo,
    ...(isDJLive ? { song_request: allPostTypes.song_request } : {}),
    shoutout: allPostTypes.shoutout
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
          const cfg = allPostTypes[post.post_type] || allPostTypes.text;
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

// ========== DJ STATUS BANNER ==========
// ========== LIVE STREAM TAB ==========
const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube: youtube.com/watch?v=ID or youtu.be/ID or youtube.com/live/ID
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` };
  // Facebook video/live
  if (url.includes('facebook.com')) {
    return { type: 'facebook', embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560&autoplay=true` };
  }
  // Instagram — no embeddable live, link out
  if (url.includes('instagram.com')) {
    return { type: 'instagram', embedUrl: null, directUrl: url };
  }
  // Twitch
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  if (twitchMatch) return { type: 'twitch', embedUrl: `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${window.location.hostname}` };
  return { type: 'unknown', embedUrl: null, directUrl: url };
};

const LiveTab = ({ djStatus, locationSlug, userId, userName, userAvatar }) => {
  const streamUrl = djStatus?.live_stream_url;
  const embed = getEmbedUrl(streamUrl);
  const djName = djStatus?.dj_stage_name || djStatus?.dj_name || 'DJ';

  return (
    <div className="flex flex-col h-full">
      {/* Stream area */}
      <div className="shrink-0">
        {embed?.embedUrl ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embed.embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              title={`${djName} Live Stream`}
              data-testid="live-stream-embed"
            />
          </div>
        ) : (
          <div className="bg-slate-900 p-6 text-center" data-testid="live-stream-link">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Video className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-white font-semibold mb-1">{djName} is Live!</p>
            <p className="text-slate-400 text-xs mb-3">
              {embed?.type === 'instagram' ? 'Watch on Instagram Live' : 'Watch the live stream'}
            </p>
            <a
              href={embed?.directUrl || streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              data-testid="live-stream-external-link"
            >
              <Video className="w-4 h-4" /> Open Live Stream
            </a>
          </div>
        )}
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/30 px-4 py-2 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Live</span>
          <span className="text-white text-xs font-medium">{djName}</span>
        </div>
      </div>

      {/* Chat below the stream — reuses ChatTab logic inline */}
      <LiveChat locationSlug={locationSlug} userId={userId} userName={userName} userAvatar={userAvatar} />
    </div>
  );
};

const LiveChat = ({ locationSlug, userId, userName, userAvatar }) => {
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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900/60">
        <p className="text-slate-400 text-xs font-medium">Live Chat</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5" data-testid="live-chat-messages">
        {messages.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-4">Chat while you watch!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === userId;
          return (
            <div key={msg.id} className={`flex items-start gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] shrink-0">
                {msg.user_avatar || '?'}
              </div>
              <div className={`px-2.5 py-1 rounded-xl text-xs max-w-[75%] ${isMe ? 'bg-red-600/80 text-white' : 'bg-slate-800 text-slate-200'}`}>
                {!isMe && <span className="text-slate-500 text-[10px] font-medium block">{msg.user_name}</span>}
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="p-2 border-t border-slate-800">
        <div className="flex gap-1.5">
          <Input value={newMsg} onChange={e => setNewMsg(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Say something..."
            className="bg-slate-800/60 border-slate-700 text-white text-xs flex-1 h-8"
            data-testid="live-chat-input" />
          <Button onClick={handleSend} disabled={sending || !newMsg.trim()}
            className="bg-red-600 hover:bg-red-700 text-white px-2.5 h-8" size="sm" data-testid="live-chat-send-btn">
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const DJStatusBanner = ({ djStatus, locationSlug }) => {
  if (!djStatus) return null;

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
    } catch { return dateStr; }
  };

  const formatTime = (t) => {
    try {
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `${hour}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}${ampm}`;
    } catch { return t; }
  };

  if (djStatus.is_live || djStatus.karaoke_active) {
    return (
      <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/30 border-b border-green-800/40 px-4 py-2.5" data-testid="dj-status-live">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-green-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xs font-bold uppercase tracking-wider">Live Now</span>
              {djStatus.karaoke_active && (
                <span className="bg-purple-600/30 text-purple-300 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-purple-600/30">
                  <Mic2 className="w-2.5 h-2.5 inline mr-0.5" />Karaoke
                </span>
              )}
            </div>
            {djStatus.dj_name && (
              <p className="text-white text-sm font-semibold truncate">{djStatus.dj_stage_name || djStatus.dj_name}</p>
            )}
          </div>
          <Music className="w-4 h-4 text-green-400/60" />
        </div>
      </div>
    );
  }

  const next = djStatus.next_session;
  if (!next) {
    return (
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2.5" data-testid="dj-status-none">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <Music className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-400 text-sm font-medium">No DJ</p>
            <p className="text-slate-600 text-xs">No upcoming sessions scheduled</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2.5" data-testid="dj-status-next">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs font-medium">No DJ — Next Session</p>
          <p className="text-white text-sm font-semibold truncate">
            {next.dj_stage_name || next.dj_name}
            {next.event_name && <span className="text-slate-400 font-normal"> — {next.event_name}</span>}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-slate-500 text-xs">
              <Calendar className="w-3 h-3" />
              {formatDate(next.date)}
            </span>
            <span className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock className="w-3 h-3" />
              {formatTime(next.start_time)}
            </span>
            {next.time_slot && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                next.time_slot === 'Brunch' ? 'bg-amber-600/20 text-amber-300 border-amber-600/30' :
                next.time_slot === 'Happy Hour' ? 'bg-orange-600/20 text-orange-300 border-orange-600/30' :
                'bg-indigo-600/20 text-indigo-300 border-indigo-600/30'
              }`}>
                {next.time_slot}
              </span>
            )}
          </div>
        </div>
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
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [djStatus, setDjStatus] = useState(null);

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

  // Fetch DJ status for this location
  useEffect(() => {
    if (!slug) return;
    const fetchDJStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dj/next-session/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setDjStatus(data);
        }
      } catch (e) { console.error('DJ status fetch error:', e); }
    };
    fetchDJStatus();
    const iv = setInterval(fetchDJStatus, 15000);
    return () => clearInterval(iv);
  }, [slug]);

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

  // Fetch notifications
  useEffect(() => {
    if (!userProfile) return;
    const fetchNotifs = async () => {
      try {
        const [nRes, cRes] = await Promise.all([
          fetch(`${API_URL}/api/wall/notifications/${userProfile.id}`),
          fetch(`${API_URL}/api/wall/notifications/unread/${userProfile.id}`)
        ]);
        const nData = await nRes.json();
        const cData = await cRes.json();
        setNotifications(nData || []);
        setUnreadNotifs(cData.count || 0);
      } catch {}
    };
    fetchNotifs();
    const iv = setInterval(fetchNotifs, 10000);
    return () => clearInterval(iv);
  }, [userProfile]);

  const markAllNotificationsRead = async () => {
    try {
      await fetch(`${API_URL}/api/wall/notifications/read-all`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userProfile.id })
      });
      setUnreadNotifs(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  };

  const isStreaming = djStatus?.is_live && djStatus?.live_stream_url;

  // Auto-switch to Live tab when stream starts
  useEffect(() => {
    if (isStreaming && activeTab !== 'live') {
      setActiveTab('live');
    }
  }, [isStreaming]);

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
    ...(isStreaming ? [{ id: 'live', label: 'Live', icon: Video }] : []),
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
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unreadNotifs > 0) markAllNotificationsRead(); }}
              className="relative w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-red-600/50 transition-colors"
              data-testid="notifications-btn">
              <Bell className="w-4 h-4 text-slate-400" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{unreadNotifs}</span>
              )}
            </button>
            <button onClick={() => navigate('/account')} className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:border-red-600/50 transition-colors" data-testid="settings-btn">
              <Settings className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifs && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 max-h-64 overflow-y-auto" data-testid="notifications-panel">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-sm font-medium">Notifications</span>
              <button onClick={() => setShowNotifs(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-xs py-4 text-center">No notifications yet</p>
            ) : (
              <div className="space-y-1">
                {notifications.map(n => (
                  <div key={n.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${n.read ? 'opacity-60' : 'bg-slate-800/50'}`}>
                    <Bell className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white font-medium">{n.title}</p>
                      {n.body && <p className="text-slate-400">{n.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DJ Status Banner */}
      <DJStatusBanner djStatus={djStatus} locationSlug={slug} />

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
        {activeTab === 'live' && isStreaming && <LiveTab djStatus={djStatus} locationSlug={slug} userId={userId} userName={userName} userAvatar={userAvatar} />}
        {activeTab === 'feed' && <FeedTab locationSlug={slug} userId={userId} userName={userName} userAvatar={userAvatar} djStatus={djStatus} />}
        {activeTab === 'chat' && <ChatTab locationSlug={slug} userId={userId} userName={userName} userAvatar={userAvatar} />}
        {activeTab === 'dms' && <DMsTab userId={userId} userName={userName} userAvatar={userAvatar} locationSlug={slug} />}
      </div>
    </div>
  );
};

export default SocialWallPage;
