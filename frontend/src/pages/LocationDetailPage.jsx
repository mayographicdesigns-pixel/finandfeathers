import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Clock, Home, Calendar, ShoppingBag, Instagram, Facebook, Twitter, ExternalLink, Navigation, Users, LogIn, LogOut, Smile, X, MessageCircle, Send, Heart, DollarSign, Music, Image as ImageIcon, ChevronLeft, Trash2, Wine, CreditCard, Smartphone, Edit2, Settings, Save, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { getLocationBySlug, verifyAdminToken, adminUpdateLocation } from '../services/api';
import { 
  checkInAtLocation, getCheckedInUsers, checkOut,
  createSocialPost, getSocialPosts, likePost, deleteSocialPost,
  sendDirectMessage, getConversations, getDMThread, getUnreadCount,
  sendDJTip, getDJTips, getDJTipsTotal, getDJAtLocation,
  sendDrink, getDrinksAtLocation, getDrinksForUser
} from '../services/api';
import { useToast } from '../hooks/use-toast';

const AVATAR_EMOJIS = ['😊', '😎', '🤩', '🥳', '😋', '🍗', '🦐', '🍹', '🔥', '💯', '🎉', '✨'];
const MOODS = ['Vibing', 'Hungry', 'Celebrating', 'Date Night', 'Girls Night', 'With Friends', 'Solo Dining', 'Business Dinner'];
const TIP_AMOUNTS = [5, 10, 20, 50, 100];

const DRINK_OPTIONS = [
  { name: 'House Cocktail', emoji: '🍸', price: '$12' },
  { name: 'Beer', emoji: '🍺', price: '$8' },
  { name: 'Wine', emoji: '🍷', price: '$10' },
  { name: 'Shot', emoji: '🥃', price: '$8' },
  { name: 'Margarita', emoji: '🍹', price: '$14' },
  { name: 'Champagne', emoji: '🥂', price: '$15' },
];

const LocationDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  // Check-in state
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkedInUsers, setCheckedInUsers] = useState([]);
  const [myCheckIn, setMyCheckIn] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [selectedMood, setSelectedMood] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Social Wall state
  const [activeTab, setActiveTab] = useState('wall'); // 'wall', 'dm', 'dj', 'drinks', 'info'
  const [socialPosts, setSocialPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // DM state
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [dmThread, setDmThread] = useState([]);
  const [newDmText, setNewDmText] = useState('');
  const [sendingDm, setSendingDm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDmModal, setShowDmModal] = useState(false);
  const [dmRecipient, setDmRecipient] = useState(null);
  
  // DJ Tipping state
  const [currentDJ, setCurrentDJ] = useState(null);
  const [djTips, setDjTips] = useState([]);
  const [djTipsTotal, setDjTipsTotal] = useState({ total: 0, count: 0 });
  const [selectedTipAmount, setSelectedTipAmount] = useState(10);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [songRequest, setSongRequest] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash_app');
  const [sendingTip, setSendingTip] = useState(false);
  
  // Send a Drink state
  const [drinks, setDrinks] = useState([]);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [drinkRecipient, setDrinkRecipient] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [drinkMessage, setDrinkMessage] = useState('');
  const [sendingDrink, setSendingDrink] = useState(false);
  const [location, setLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  
  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  // Check if admin is logged in
  useEffect(() => {
    const checkAdmin = async () => {
      const isValid = await verifyAdminToken();
      setIsAdmin(isValid);
    };
    checkAdmin();
  }, []);

  // Admin functions
  const handleEditLocation = () => {
    setEditingLocation({ ...location });
    setEditMode(true);
  };

  const handleSaveLocation = async () => {
    if (!editingLocation) return;
    try {
      await adminUpdateLocation(location.id, editingLocation);
      setLocation(editingLocation);
      setEditMode(false);
      setEditingLocation(null);
      toast({ title: 'Success', description: 'Location updated!' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    setEditMode(false);
    toast({ title: 'Logged Out', description: 'Admin session ended' });
  };

  // Fetch location data from API
  useEffect(() => {
    const fetchLocation = async () => {
      setIsLoadingLocation(true);
      const data = await getLocationBySlug(slug);
      setLocation(data);
      setIsLoadingLocation(false);
    };
    if (slug) {
      fetchLocation();
    }
  }, [slug]);

  // Check for checkin parameter in URL (from QR code scan)
  useEffect(() => {
    const shouldCheckIn = searchParams.get('checkin');
    if (shouldCheckIn === 'true' && !myCheckIn) {
      setShowCheckInModal(true);
    }
  }, [searchParams, myCheckIn]);

  // Load checked-in users and social data
  useEffect(() => {
    if (slug) {
      loadCheckedInUsers();
      loadSocialPosts();
      loadDJData();
      loadDrinks();
      // Check if user already checked in (from localStorage)
      const savedCheckIn = localStorage.getItem(`checkin_${slug}`);
      if (savedCheckIn) {
        const parsed = JSON.parse(savedCheckIn);
        setMyCheckIn(parsed);
        loadConversations(parsed.id);
        loadUnreadCount(parsed.id);
      }
    }
  }, [slug]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (slug) {
        loadCheckedInUsers();
        loadSocialPosts();
        loadDJData();
        loadDrinks();
        if (myCheckIn) {
          loadUnreadCount(myCheckIn.id);
        }
      }
    }, 15000); // Every 15 seconds
    return () => clearInterval(interval);
  }, [slug, myCheckIn]);

  const loadCheckedInUsers = async () => {
    const users = await getCheckedInUsers(slug);
    setCheckedInUsers(users);
  };

  const loadSocialPosts = async () => {
    try {
      const posts = await getSocialPosts(slug, myCheckIn?.id);
      setSocialPosts(posts);
    } catch (e) {
      console.error('Error loading posts:', e);
    }
  };

  const loadConversations = async (checkinId) => {
    try {
      const convs = await getConversations(checkinId);
      setConversations(convs);
    } catch (e) {
      console.error('Error loading conversations:', e);
    }
  };

  const loadUnreadCount = async (checkinId) => {
    try {
      const data = await getUnreadCount(checkinId);
      setUnreadCount(data.unread_count);
    } catch (e) {
      console.error('Error loading unread count:', e);
    }
  };

  const loadDJData = async () => {
    try {
      // Load DJ profile first
      const dj = await getDJAtLocation(slug);
      setCurrentDJ(dj);
    } catch (e) {
      console.error('Error loading DJ:', e);
      setCurrentDJ(null);
    }
    
    try {
      const tips = await getDJTips(slug);
      setDjTips(tips);
    } catch (e) {
      console.error('Error loading DJ tips:', e);
      setDjTips([]);
    }
    
    try {
      const total = await getDJTipsTotal(slug);
      setDjTipsTotal(total);
    } catch (e) {
      console.error('Error loading DJ tips total:', e);
      setDjTipsTotal({ total: 0, count: 0 });
    }
  };

  const loadDrinks = async () => {
    try {
      const drinksData = await getDrinksAtLocation(slug);
      setDrinks(drinksData);
    } catch (e) {
      console.error('Error loading drinks:', e);
    }
  };

  const loadDMThread = async (partnerId) => {
    if (!myCheckIn) return;
    try {
      const thread = await getDMThread(myCheckIn.id, partnerId);
      setDmThread(thread);
      loadUnreadCount(myCheckIn.id);
    } catch (e) {
      console.error('Error loading DM thread:', e);
    }
  };

  const handleCheckIn = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a display name to check in",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const checkInData = {
        location_slug: slug,
        display_name: displayName.trim(),
        avatar_emoji: selectedEmoji,
        mood: selectedMood || null,
        message: message.trim() || null
      };

      const result = await checkInAtLocation(checkInData);
      setMyCheckIn(result);
      localStorage.setItem(`checkin_${slug}`, JSON.stringify(result));
      setShowCheckInModal(false);
      await loadCheckedInUsers();

      toast({
        title: "You're checked in! 🎉",
        description: `Welcome to ${location?.name}! Join the conversation.`,
      });
    } catch (error) {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!myCheckIn) return;

    try {
      await checkOut(myCheckIn.id);
      localStorage.removeItem(`checkin_${slug}`);
      setMyCheckIn(null);
      await loadCheckedInUsers();

      toast({
        title: "Checked out",
        description: "Thanks for visiting! See you next time.",
      });
    } catch (error) {
      localStorage.removeItem(`checkin_${slug}`);
      setMyCheckIn(null);
    }
  };

  const handlePostMessage = async () => {
    if (!myCheckIn || !newPostText.trim()) return;

    setPostingMessage(true);
    try {
      await createSocialPost({
        location_slug: slug,
        checkin_id: myCheckIn.id,
        author_name: myCheckIn.display_name,
        author_emoji: myCheckIn.avatar_emoji,
        message: newPostText.trim(),
        image_url: newPostImage || null
      });
      setNewPostText('');
      setNewPostImage('');
      await loadSocialPosts();
      toast({ title: "Posted!", description: "Your message is now on the wall." });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPostingMessage(false);
    }
  };

  const handleLikePost = async (postId) => {
    if (!myCheckIn) return;
    try {
      await likePost(postId, myCheckIn.id);
      await loadSocialPosts();
    } catch (e) {
      console.error('Error liking post:', e);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!myCheckIn || !window.confirm('Delete this post?')) return;
    try {
      await deleteSocialPost(postId, myCheckIn.id);
      await loadSocialPosts();
      toast({ title: "Deleted", description: "Your post has been removed." });
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const openDMWithUser = (user) => {
    setDmRecipient(user);
    setShowDmModal(true);
    if (myCheckIn) {
      loadDMThread(user.id);
    }
  };

  const handleSendDM = async () => {
    if (!myCheckIn || !dmRecipient || !newDmText.trim()) return;

    setSendingDm(true);
    try {
      await sendDirectMessage({
        location_slug: slug,
        from_checkin_id: myCheckIn.id,
        from_name: myCheckIn.display_name,
        from_emoji: myCheckIn.avatar_emoji,
        to_checkin_id: dmRecipient.id,
        to_name: dmRecipient.display_name,
        to_emoji: dmRecipient.avatar_emoji,
        message: newDmText.trim()
      });
      setNewDmText('');
      await loadDMThread(dmRecipient.id);
      await loadConversations(myCheckIn.id);
      toast({ title: "Sent!", description: `Message sent to ${dmRecipient.display_name}` });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingDm(false);
    }
  };

  const openPaymentApp = (method, amount) => {
    const tipAmount = customTipAmount ? parseFloat(customTipAmount) : amount;
    if (!currentDJ) {
      toast({ title: "No DJ", description: "No DJ is currently playing", variant: "destructive" });
      return;
    }

    let url = '';
    if (method === 'cash_app' && currentDJ.cash_app_username) {
      // Cash App deep link format: https://cash.app/$username/amount
      const username = currentDJ.cash_app_username.replace('$', '');
      url = `https://cash.app/$${username}/${tipAmount}`;
    } else if (method === 'venmo' && currentDJ.venmo_username) {
      // Venmo deep link
      const username = currentDJ.venmo_username.replace('@', '');
      url = `https://venmo.com/${username}?txn=pay&amount=${tipAmount}&note=DJ%20Tip`;
    } else if (method === 'apple_pay') {
      toast({ title: "Apple Pay", description: `Tap to pay $${tipAmount} on the DJ's device`, variant: "default" });
      return;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleSendTip = async () => {
    if (!myCheckIn) return;

    const amount = customTipAmount ? parseFloat(customTipAmount) : selectedTipAmount;
    if (!amount || amount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter at least $1", variant: "destructive" });
      return;
    }

    // Open payment app
    openPaymentApp(selectedPaymentMethod, amount);

    // Record the tip in database
    setSendingTip(true);
    try {
      await sendDJTip({
        location_slug: slug,
        checkin_id: myCheckIn.id,
        tipper_name: myCheckIn.display_name,
        tipper_emoji: myCheckIn.avatar_emoji,
        amount: amount,
        message: tipMessage.trim() || null,
        song_request: songRequest.trim() || null,
        payment_method: selectedPaymentMethod
      });
      setTipMessage('');
      setSongRequest('');
      setCustomTipAmount('');
      await loadDJData();
      toast({ title: "Tip Recorded! 🎵", description: `$${amount} tip sent via ${selectedPaymentMethod.replace('_', ' ')}!` });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingTip(false);
    }
  };

  const openDrinkModalForUser = (user) => {
    setDrinkRecipient(user);
    setSelectedDrink(null);
    setDrinkMessage('');
    setShowDrinkModal(true);
  };

  const handleSendDrink = async () => {
    if (!myCheckIn || !drinkRecipient || !selectedDrink) return;

    setSendingDrink(true);
    try {
      await sendDrink({
        location_slug: slug,
        from_checkin_id: myCheckIn.id,
        from_name: myCheckIn.display_name,
        from_emoji: myCheckIn.avatar_emoji,
        to_checkin_id: drinkRecipient.id,
        to_name: drinkRecipient.display_name,
        to_emoji: drinkRecipient.avatar_emoji,
        drink_name: selectedDrink.name,
        drink_emoji: selectedDrink.emoji,
        message: drinkMessage.trim() || null
      });
      setShowDrinkModal(false);
      setSelectedDrink(null);
      setDrinkMessage('');
      await loadDrinks();
      toast({ title: "Drink Sent! 🍸", description: `${selectedDrink.emoji} sent to ${drinkRecipient.display_name}!` });
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingDrink(false);
    }
  };

  if (isLoadingLocation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading location...</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Location Not Found</h1>
          <Button onClick={() => navigate('/locations')} className="bg-red-600 hover:bg-red-700">
            View All Locations
          </Button>
        </div>
      </div>
    );
  }

  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todaysSpecial = location.weekly_specials?.find(s => s.day.toLowerCase() === currentDay);

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-red-600/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Check In</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-slate-300 mb-6">
                Join the vibe at <span className="text-red-500 font-semibold">{location.name}</span>! 
                Let others know you're here.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
                <Input
                  type="text"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  maxLength={20}
                  data-testid="checkin-name-input"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Pick Your Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`w-10 h-10 text-2xl rounded-lg flex items-center justify-center transition-all ${
                        selectedEmoji === emoji ? 'bg-red-600 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">What's Your Vibe?</label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => setSelectedMood(selectedMood === mood ? '' : mood)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                        selectedMood === mood ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Quick Message (optional)</label>
                <Input
                  type="text"
                  placeholder="What are you excited about?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  maxLength={50}
                />
              </div>

              <Button
                onClick={handleCheckIn}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
                data-testid="checkin-submit-btn"
              >
                {isLoading ? 'Checking in...' : `Check In ${selectedEmoji}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* DM Modal */}
      {showDmModal && dmRecipient && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setShowDmModal(false)} className="text-white">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-2xl">{dmRecipient.avatar_emoji}</span>
            <div>
              <p className="text-white font-medium">{dmRecipient.display_name}</p>
              <p className="text-slate-400 text-xs">{dmRecipient.mood || 'Hanging out'}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {dmThread.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from_checkin_id === myCheckIn?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.from_checkin_id === myCheckIn?.id 
                    ? 'bg-red-600 text-white' 
                    : 'bg-slate-800 text-white'
                }`}>
                  <p>{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {dmThread.length === 0 && (
              <p className="text-center text-slate-500 py-8">Start the conversation!</p>
            )}
          </div>

          <div className="bg-slate-900 border-t border-slate-700 p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newDmText}
                onChange={(e) => setNewDmText(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSendDM()}
                data-testid="dm-input"
              />
              <Button 
                onClick={handleSendDM} 
                disabled={sendingDm || !newDmText.trim()}
                className="bg-red-600 hover:bg-red-700"
                data-testid="dm-send-btn"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send a Drink Modal */}
      {showDrinkModal && drinkRecipient && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-pink-600/50 w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wine className="w-5 h-5 text-pink-500" />
                  Send a Drink
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowDrinkModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-slate-300 mb-4">
                Sending to <span className="text-2xl">{drinkRecipient.avatar_emoji}</span> <span className="text-pink-400 font-semibold">{drinkRecipient.display_name}</span>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Choose a Drink</label>
                <div className="grid grid-cols-2 gap-2">
                  {DRINK_OPTIONS.map((drink) => (
                    <button
                      key={drink.name}
                      onClick={() => setSelectedDrink(drink)}
                      className={`p-3 rounded-lg text-left transition-all ${
                        selectedDrink?.name === drink.name 
                          ? 'bg-pink-600 text-white' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      data-testid={`drink-option-${drink.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <span className="text-2xl">{drink.emoji}</span>
                      <p className="text-sm font-medium mt-1">{drink.name}</p>
                      <p className="text-xs opacity-70">{drink.price}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Add a Message (optional)</label>
                <Input
                  placeholder="Cheers! 🥂"
                  value={drinkMessage}
                  onChange={(e) => setDrinkMessage(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  maxLength={100}
                  data-testid="drink-message-input"
                />
              </div>

              <Button
                onClick={handleSendDrink}
                disabled={sendingDrink || !selectedDrink}
                className="w-full bg-pink-600 hover:bg-pink-700 h-12"
                data-testid="send-drink-btn"
              >
                {sendingDrink ? 'Sending...' : `Send ${selectedDrink?.emoji || '🍸'} to ${drinkRecipient.display_name}`}
              </Button>
              
              <p className="text-slate-500 text-xs text-center mt-3">
                💳 Pay at the bar when your drink order is ready
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <Button onClick={() => setLightboxImage(null)} className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700">
            <X className="w-6 h-6" />
          </Button>
          <img src={lightboxImage} alt="Post" className="max-w-full max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => navigate('/')} variant="outline" className="bg-slate-800/70 border-red-600/50 text-red-500 hover:bg-slate-700">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
          <Button onClick={() => navigate('/locations')} variant="outline" className="bg-slate-800/70 border-slate-600 text-slate-300 hover:bg-slate-700">
            <MapPin className="w-4 h-4 mr-2" />
            All Locations
          </Button>
        </div>

        {/* Logo and Location Name */}
        <div className="text-center mb-6">
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
            alt="Fin & Feathers"
            className="max-h-24 w-auto mx-auto mb-3 cursor-pointer"
            onClick={() => navigate('/')}
          />
          <h1 className="text-2xl font-bold text-white">{location.name}</h1>
          <p className="text-slate-400 text-sm">{location.address}</p>
        </div>

        {/* Check-in Status Bar */}
        {myCheckIn ? (
          <Card className="mb-4 bg-green-900/30 border-green-600/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{myCheckIn.avatar_emoji}</span>
                <div>
                  <p className="text-white font-medium">You're checked in as {myCheckIn.display_name}</p>
                  <p className="text-green-400 text-xs">Join the conversation below!</p>
                </div>
              </div>
              <Button onClick={handleCheckOut} variant="outline" size="sm" className="border-red-600/50 text-red-400 hover:bg-red-900/30">
                <LogOut className="w-4 h-4 mr-1" />
                Check Out
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowCheckInModal(true)} className="w-full mb-4 bg-red-600 hover:bg-red-700 text-white h-14 text-lg" data-testid="checkin-button">
            <LogIn className="w-5 h-5 mr-2" />
            Check In to Join the Vibe
          </Button>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            onClick={() => setActiveTab('wall')}
            variant={activeTab === 'wall' ? 'default' : 'outline'}
            className={activeTab === 'wall' ? 'bg-red-600' : 'border-slate-600 text-slate-300'}
            data-testid="tab-wall"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Wall
          </Button>
          <Button
            onClick={() => { setActiveTab('dm'); if (myCheckIn) loadConversations(myCheckIn.id); }}
            variant={activeTab === 'dm' ? 'default' : 'outline'}
            className={`${activeTab === 'dm' ? 'bg-red-600' : 'border-slate-600 text-slate-300'} relative`}
            data-testid="tab-dm"
          >
            <Send className="w-4 h-4 mr-2" />
            DMs
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button
            onClick={() => setActiveTab('drinks')}
            variant={activeTab === 'drinks' ? 'default' : 'outline'}
            className={activeTab === 'drinks' ? 'bg-pink-600' : 'border-slate-600 text-slate-300'}
            data-testid="tab-drinks"
          >
            <Wine className="w-4 h-4 mr-2" />
            Drinks
          </Button>
          <Button
            onClick={() => setActiveTab('dj')}
            variant={activeTab === 'dj' ? 'default' : 'outline'}
            className={activeTab === 'dj' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}
            data-testid="tab-dj"
          >
            <Music className="w-4 h-4 mr-2" />
            Tip DJ
          </Button>
          <Button
            onClick={() => setActiveTab('info')}
            variant={activeTab === 'info' ? 'default' : 'outline'}
            className={activeTab === 'info' ? 'bg-red-600' : 'border-slate-600 text-slate-300'}
            data-testid="tab-info"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Info
          </Button>
        </div>

        {/* Social Wall Tab */}
        {activeTab === 'wall' && (
          <div className="space-y-4">
            {/* Who's Here */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-500" />
                    Who's Here ({checkedInUsers.length})
                  </h3>
                </div>
                {checkedInUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {checkedInUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-1">
                        <button
                          onClick={() => user.id !== myCheckIn?.id && openDMWithUser(user)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                            myCheckIn?.id === user.id 
                              ? 'bg-green-900/30 border border-green-600/30' 
                              : 'bg-slate-700/50 hover:bg-slate-600/50 cursor-pointer'
                          }`}
                          data-testid={`user-${user.id}`}
                        >
                          <span className="text-xl">{user.avatar_emoji}</span>
                          <span className="text-white text-sm">{user.display_name}</span>
                          {user.mood && <span className="text-red-400 text-xs">• {user.mood}</span>}
                        </button>
                        {myCheckIn && user.id !== myCheckIn.id && (
                          <button
                            onClick={() => openDrinkModalForUser(user)}
                            className="p-1.5 bg-pink-600/30 hover:bg-pink-600/50 rounded-full transition-colors"
                            title="Send a drink"
                            data-testid={`send-drink-${user.id}`}
                          >
                            <Wine className="w-4 h-4 text-pink-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Be the first to check in!</p>
                )}
              </CardContent>
            </Card>

            {/* Post Input */}
            {myCheckIn && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <span className="text-2xl">{myCheckIn.avatar_emoji}</span>
                    <div className="flex-1">
                      <Textarea
                        placeholder="What's happening at F&F?"
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white mb-2 min-h-[80px]"
                        maxLength={280}
                        data-testid="post-textarea"
                      />
                      {newPostImage && (
                        <div className="relative mb-2 inline-block">
                          <img src={newPostImage} alt="Preview" className="w-20 h-20 object-cover rounded" />
                          <button onClick={() => setNewPostImage('')} className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1">
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Image URL (optional)"
                          value={newPostImage}
                          onChange={(e) => setNewPostImage(e.target.value)}
                          className="bg-slate-900 border-slate-700 text-white w-48 text-sm"
                        />
                        <Button 
                          onClick={handlePostMessage} 
                          disabled={postingMessage || !newPostText.trim()}
                          className="bg-red-600 hover:bg-red-700"
                          data-testid="post-submit-btn"
                        >
                          {postingMessage ? 'Posting...' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Feed */}
            <div className="space-y-3">
              {socialPosts.map((post) => (
                <Card key={post.id} className="bg-slate-800/50 border-slate-700" data-testid={`post-${post.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <span className="text-2xl">{post.author_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium">{post.author_name}</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className="text-slate-300 mt-1">{post.message}</p>
                        {post.image_url && (
                          <img 
                            src={post.image_url} 
                            alt="Post" 
                            className="mt-2 rounded-lg max-h-60 cursor-pointer hover:opacity-90"
                            onClick={() => setLightboxImage(post.image_url)}
                          />
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <button 
                            onClick={() => handleLikePost(post.id)}
                            className={`flex items-center gap-1 text-sm ${post.liked_by_me ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
                            data-testid={`like-btn-${post.id}`}
                          >
                            <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
                            {post.likes_count > 0 && post.likes_count}
                          </button>
                          {post.checkin_id === myCheckIn?.id && (
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="text-slate-500 hover:text-red-500 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {socialPosts.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DM Tab */}
        {activeTab === 'dm' && (
          <div className="space-y-4">
            {!myCheckIn ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center text-slate-400">
                  <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Check in to send messages to other guests!</p>
                </CardContent>
              </Card>
            ) : conversations.length > 0 ? (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Card 
                    key={conv.partner_id} 
                    className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setDmRecipient({ id: conv.partner_id, display_name: conv.partner_name, avatar_emoji: conv.partner_emoji });
                      setShowDmModal(true);
                      loadDMThread(conv.partner_id);
                    }}
                    data-testid={`conversation-${conv.partner_id}`}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{conv.partner_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{conv.partner_name}</p>
                        <p className="text-slate-400 text-sm truncate">{conv.last_message}</p>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center text-slate-400">
                  <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversations yet.</p>
                  <p className="text-sm mt-1">Tap on someone in "Who's Here" to start chatting!</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Drinks Tab */}
        {activeTab === 'drinks' && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-pink-900/50 to-slate-800/50 border-pink-600/30">
              <CardContent className="p-6 text-center">
                <Wine className="w-12 h-12 text-pink-400 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-white mb-1">Send a Drink</h3>
                <p className="text-slate-300">Buy someone a drink at the bar!</p>
              </CardContent>
            </Card>

            {!myCheckIn ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center text-slate-400">
                  <Wine className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Check in to send drinks to other guests!</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Quick Send - People here */}
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold mb-3">Send a drink to someone here</h3>
                    <div className="flex flex-wrap gap-2">
                      {checkedInUsers.filter(u => u.id !== myCheckIn?.id).map((user) => (
                        <button
                          key={user.id}
                          onClick={() => openDrinkModalForUser(user)}
                          className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-700/50 hover:bg-pink-600/30 transition-colors"
                        >
                          <span className="text-xl">{user.avatar_emoji}</span>
                          <span className="text-white text-sm">{user.display_name}</span>
                          <Wine className="w-4 h-4 text-pink-400" />
                        </button>
                      ))}
                      {checkedInUsers.filter(u => u.id !== myCheckIn?.id).length === 0 && (
                        <p className="text-slate-500 text-sm">No one else is checked in yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Drinks */}
                <div>
                  <h3 className="text-white font-semibold mb-3">Recent Drinks Sent 🍸</h3>
                  <div className="space-y-2">
                    {drinks.map((drink) => (
                      <Card key={drink.id} className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-3 flex items-center gap-3">
                          <span className="text-2xl">{drink.drink_emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm">
                              <span className="font-medium">{drink.from_emoji} {drink.from_name}</span>
                              <span className="text-slate-400"> sent </span>
                              <span className="text-pink-400">{drink.drink_name}</span>
                              <span className="text-slate-400"> to </span>
                              <span className="font-medium">{drink.to_emoji} {drink.to_name}</span>
                            </p>
                            {drink.message && <p className="text-slate-400 text-xs mt-1">"{drink.message}"</p>}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            drink.status === 'delivered' ? 'bg-green-600/30 text-green-400' :
                            drink.status === 'accepted' ? 'bg-blue-600/30 text-blue-400' :
                            'bg-yellow-600/30 text-yellow-400'
                          }`}>
                            {drink.status}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                    {drinks.length === 0 && (
                      <p className="text-center text-slate-500 py-4">No drinks sent yet tonight!</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* DJ Tipping Tab */}
        {activeTab === 'dj' && (
          <div className="space-y-4">
            {/* DJ Profile Card */}
            {currentDJ ? (
              <Card className="bg-gradient-to-br from-purple-900/50 to-slate-800/50 border-purple-600/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-purple-600/30 flex items-center justify-center text-4xl">
                      {currentDJ.avatar_emoji}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{currentDJ.stage_name || currentDJ.name}</h3>
                      <p className="text-purple-300 text-sm">🎧 Now Playing</p>
                      {currentDJ.bio && <p className="text-slate-400 text-xs mt-1">{currentDJ.bio}</p>}
                    </div>
                  </div>
                  
                  {/* Payment Links */}
                  <div className="flex flex-wrap gap-2">
                    {currentDJ.cash_app_username && (
                      <Button
                        onClick={() => setSelectedPaymentMethod('cash_app')}
                        variant={selectedPaymentMethod === 'cash_app' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'cash_app' ? 'bg-green-600' : 'border-green-600/50 text-green-400'}
                        data-testid="payment-cash-app"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Cash App
                      </Button>
                    )}
                    {currentDJ.venmo_username && (
                      <Button
                        onClick={() => setSelectedPaymentMethod('venmo')}
                        variant={selectedPaymentMethod === 'venmo' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'venmo' ? 'bg-blue-600' : 'border-blue-600/50 text-blue-400'}
                        data-testid="payment-venmo"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Venmo
                      </Button>
                    )}
                    {currentDJ.apple_pay_phone && (
                      <Button
                        onClick={() => setSelectedPaymentMethod('apple_pay')}
                        variant={selectedPaymentMethod === 'apple_pay' ? 'default' : 'outline'}
                        className={selectedPaymentMethod === 'apple_pay' ? 'bg-slate-600' : 'border-slate-600/50 text-slate-300'}
                        data-testid="payment-apple-pay"
                      >
                        <Smartphone className="w-4 h-4 mr-1" />
                        Apple Pay
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-purple-900/50 to-slate-800/50 border-purple-600/30">
                <CardContent className="p-6 text-center">
                  <Music className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-white mb-1">No DJ Playing</h3>
                  <p className="text-slate-400 text-sm">Check back later for live music!</p>
                </CardContent>
              </Card>
            )}

            {/* DJ Tips Total */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-slate-400 text-sm">Tonight's Tips</p>
                <p className="text-3xl font-bold text-green-400">${djTipsTotal.total.toFixed(2)}</p>
                <p className="text-slate-500 text-xs">{djTipsTotal.count} tips received</p>
              </CardContent>
            </Card>

            {/* Tip Form */}
            {myCheckIn && currentDJ ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Send a Tip
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {TIP_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => { setSelectedTipAmount(amount); setCustomTipAmount(''); }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          selectedTipAmount === amount && !customTipAmount
                            ? 'bg-green-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                        data-testid={`tip-amount-${amount}`}
                      >
                        ${amount}
                      </button>
                    ))}
                    <Input
                      type="number"
                      placeholder="Custom"
                      value={customTipAmount}
                      onChange={(e) => setCustomTipAmount(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-white w-24"
                      min="1"
                    />
                  </div>

                  <Input
                    placeholder="Message for the DJ (optional)"
                    value={tipMessage}
                    onChange={(e) => setTipMessage(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white mb-3"
                    maxLength={100}
                    data-testid="tip-message-input"
                  />

                  <Input
                    placeholder="🎵 Request a song (optional)"
                    value={songRequest}
                    onChange={(e) => setSongRequest(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white mb-4"
                    maxLength={100}
                    data-testid="song-request-input"
                  />

                  <Button 
                    onClick={handleSendTip}
                    disabled={sendingTip}
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                    data-testid="send-tip-btn"
                  >
                    {sendingTip ? 'Opening Payment...' : `Tip $${customTipAmount || selectedTipAmount} via ${selectedPaymentMethod.replace('_', ' ')}`}
                  </Button>

                  <p className="text-slate-500 text-xs text-center mt-2">
                    This will open {selectedPaymentMethod.replace('_', ' ')} to complete the payment
                  </p>
                </CardContent>
              </Card>
            ) : !myCheckIn ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center text-slate-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Check in to tip the DJ!</p>
                </CardContent>
              </Card>
            ) : null}

            {/* Recent Tips */}
            <div>
              <h3 className="text-white font-semibold mb-3">Recent Tips</h3>
              <div className="space-y-2">
                {djTips.map((tip) => (
                  <Card key={tip.id} className="bg-slate-800/50 border-slate-700" data-testid={`tip-${tip.id}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <span className="text-2xl">{tip.tipper_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{tip.tipper_name}</span>
                          <span className="text-green-400 font-bold">${tip.amount}</span>
                          <span className="text-slate-500 text-xs">
                            via {tip.payment_method?.replace('_', ' ') || 'cash app'}
                          </span>
                        </div>
                        {tip.message && <p className="text-slate-400 text-sm truncate">{tip.message}</p>}
                        {tip.song_request && <p className="text-purple-400 text-sm">🎵 {tip.song_request}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {djTips.length === 0 && (
                  <p className="text-center text-slate-500 py-4">No tips yet tonight. Be the first!</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-4">
            {/* Map */}
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent className="p-4">
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title={`Map of ${location.name}`}
                  />
                </div>
                <Button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`, '_blank')}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>

            {/* Contact & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
                  <div className="space-y-3">
                    <a href={`tel:${location.phone}`} className="flex items-center gap-3 text-slate-300 hover:text-red-400">
                      <Phone className="w-4 h-4 text-red-500" />
                      {location.phone}
                    </a>
                    <div className="flex items-center gap-3 text-slate-300">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{location.address}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/80 border-slate-700">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-red-500" />
                    Hours
                  </h2>
                  <div className="space-y-1 text-sm">
                    {Object.entries(location.hours).map(([day, hours]) => (
                      <div key={day} className={`flex justify-between ${day === currentDay ? 'text-red-500 font-semibold' : 'text-slate-300'}`}>
                        <span className="capitalize">{day}</span>
                        <span>{hours}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => navigate('/menu')} className="bg-red-600 hover:bg-red-700 h-12">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Menu
              </Button>
              <Button onClick={() => window.open(location.online_ordering, '_blank')} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 h-12">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Order Online
              </Button>
            </div>

            {/* Today's Special */}
            {todaysSpecial && (
              <Card className="bg-gradient-to-r from-red-900/30 to-slate-800/50 border-red-600/30">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold text-white mb-1">Today's Special</h2>
                  <p className="text-red-400">{todaysSpecial.special}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationDetailPage;
