import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Phone, Clock, Home, Calendar, ShoppingBag, Instagram, Facebook, Twitter, ExternalLink, Navigation, Users, LogIn, LogOut, Smile, X, MessageCircle, Send, Heart, DollarSign, Music, Image as ImageIcon, ChevronLeft, Trash2, Wine, CreditCard, Smartphone, Edit2, Settings, Save, Plus, Camera, RotateCcw, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { getLocationBySlug, verifyAdminToken, adminUpdateLocation, uploadImage, getStaffList, transferTokens, getTokenBalance, getDJSchedulesForLocation } from '../services/api';
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
const STAFF_TIP_AMOUNTS = [10, 20, 50, 100];

const DRINK_OPTIONS = [
  { name: 'House Cocktail', emoji: '🍸', price: '$12' },
  { name: 'Beer', emoji: '🍺', price: '$8' },
  { name: 'Wine', emoji: '🍷', price: '$10' },
  { name: 'Shot', emoji: '🥃', price: '$8' },
  { name: 'Margarita', emoji: '🍹', price: '$14' },
  { name: 'Champagne', emoji: '🥂', price: '$15' },
];

// Tip Staff Tab Component
const TipStaffTab = ({ myCheckIn, locationSlug, toast }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [tipAmount, setTipAmount] = useState(20);
  const [customTipAmount, setCustomTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    loadStaffAndBalance();
  }, [myCheckIn]);

  const loadStaffAndBalance = async () => {
    setLoading(true);
    try {
      const staff = await getStaffList();
      setStaffList(staff || []);
      
      // Get user's token balance if checked in
      if (myCheckIn) {
        const savedProfileId = localStorage.getItem('ff_user_profile_id');
        if (savedProfileId) {
          const balance = await getTokenBalance(savedProfileId);
          setUserBalance(balance?.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTipStaff = async () => {
    if (!selectedStaff || !myCheckIn) return;
    
    const amount = customTipAmount ? parseInt(customTipAmount) : tipAmount;
    if (!amount || amount < 1) {
      toast({ title: 'Error', description: 'Please enter a valid tip amount', variant: 'destructive' });
      return;
    }
    
    if (amount > userBalance) {
      toast({ title: 'Insufficient Tokens', description: 'Please purchase more tokens to tip staff', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const savedProfileId = localStorage.getItem('ff_user_profile_id');
      if (!savedProfileId) {
        toast({ title: 'Error', description: 'Please log in to tip staff', variant: 'destructive' });
        return;
      }
      
      await transferTokens(savedProfileId, {
        to_user_id: selectedStaff.id,
        amount: amount,
        message: tipMessage || `Tip at ${locationSlug}`
      });
      
      toast({ title: 'Tip Sent!', description: `Sent ${amount} tokens to ${selectedStaff.name}` });
      
      // Reset form and reload balance
      setSelectedStaff(null);
      setTipAmount(20);
      setCustomTipAmount('');
      setTipMessage('');
      loadStaffAndBalance();
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to send tip', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-400">Loading staff...</p>
      </div>
    );
  }

  if (!myCheckIn) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center text-slate-400">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Check in to tip staff members!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-amber-900/50 to-slate-800/50 border-amber-600/30">
        <CardContent className="p-6 text-center">
          <DollarSign className="w-12 h-12 text-amber-400 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-white mb-1">Tip Our Staff</h3>
          <p className="text-slate-300">Show appreciation for great service!</p>
          <p className="text-amber-400 text-sm mt-2">Your Balance: {userBalance} tokens</p>
        </CardContent>
      </Card>

      {/* Staff List */}
      {staffList.length > 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-4">Select Staff Member</h3>
            <div className="grid grid-cols-2 gap-3">
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => setSelectedStaff(staff)}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedStaff?.id === staff.id
                      ? 'border-amber-500 bg-amber-600/20'
                      : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                  }`}
                  data-testid={`staff-${staff.id}`}
                >
                  <div className="flex items-center gap-3">
                    {staff.profile_photo_url ? (
                      <img src={staff.profile_photo_url} alt={staff.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-xl">
                        {staff.avatar_emoji || '👤'}
                      </span>
                    )}
                    <div>
                      <p className="text-white font-medium text-sm">{staff.name}</p>
                      <p className="text-slate-400 text-xs">{staff.staff_title || 'Staff'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            <p>No staff members available at this time</p>
          </CardContent>
        </Card>
      )}

      {/* Tip Form - Shows when staff is selected */}
      {selectedStaff && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-500" />
              Tip {selectedStaff.name}
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {STAFF_TIP_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setTipAmount(amount); setCustomTipAmount(''); }}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    tipAmount === amount && !customTipAmount
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  data-testid={`staff-tip-${amount}`}
                >
                  {amount} tokens
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
              placeholder="Add a message (optional)"
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white mb-4"
              maxLength={100}
              data-testid="staff-tip-message"
            />

            <Button 
              onClick={handleTipStaff}
              disabled={sending || (customTipAmount ? parseInt(customTipAmount) : tipAmount) > userBalance}
              className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-lg"
              data-testid="send-staff-tip-btn"
            >
              {sending ? 'Sending...' : `Send ${customTipAmount || tipAmount} Tokens`}
            </Button>

            {(customTipAmount ? parseInt(customTipAmount) : tipAmount) > userBalance && (
              <p className="text-red-400 text-xs text-center mt-2">
                Insufficient tokens. Visit My Account to purchase more.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

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
  
  // Selfie camera state
  const [showCamera, setShowCamera] = useState(false);
  const [selfieImage, setSelfieImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Social Wall state
  const [activeTab, setActiveTab] = useState('wall'); // 'wall', 'dm', 'dj', 'drinks', 'info'
  const [socialPosts, setSocialPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  
  // Post photo capture state
  const [showPostCamera, setShowPostCamera] = useState(false);
  const [postCameraStream, setPostCameraStream] = useState(null);
  const [uploadingPostPhoto, setUploadingPostPhoto] = useState(false);
  const postVideoRef = useRef(null);
  const postCanvasRef = useRef(null);
  
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
  const [djSchedules, setDjSchedules] = useState([]); // Upcoming DJ schedules
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
      const refreshed = await getLocationBySlug(slug);
      setLocation(refreshed);
      setEditingLocation(refreshed);
      setEditMode(false);
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
      // Load DJ profile first (currently live)
      const dj = await getDJAtLocation(slug);
      setCurrentDJ(dj);
    } catch (e) {
      console.error('Error loading DJ:', e);
      setCurrentDJ(null);
    }
    
    try {
      // Load upcoming DJ schedules
      const schedules = await getDJSchedulesForLocation(slug);
      setDjSchedules(schedules || []);
    } catch (e) {
      console.error('Error loading DJ schedules:', e);
      setDjSchedules([]);
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

  // Camera/Selfie functions
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Could not access camera. Please allow camera permissions.');
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureSelfie = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas to square dimensions
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 400;
    canvas.height = 400;

    // Calculate crop to center (square crop)
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    // Draw cropped and resized image
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);

    // Convert to blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setUploadingSelfie(true);
      stopCamera();

      try {
        // Create a file from blob
        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const result = await uploadImage(file);
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const fullUrl = `${backendUrl}${result.url}`;
        setSelfieImage(fullUrl);
        toast({ title: 'Selfie captured!', description: 'Looking good!' });
      } catch (err) {
        console.error('Upload error:', err);
        toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
      } finally {
        setUploadingSelfie(false);
      }
    }, 'image/jpeg', 0.85);
  };

  const retakeSelfie = () => {
    setSelfieImage(null);
    startCamera();
  };

  // Cleanup camera on modal close
  useEffect(() => {
    if (!showCheckInModal && cameraStream) {
      stopCamera();
    }
  }, [showCheckInModal]);

  // Post photo capture functions
  const startPostCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setPostCameraStream(stream);
      setShowPostCamera(true);
      
      setTimeout(() => {
        if (postVideoRef.current) {
          postVideoRef.current.srcObject = stream;
          postVideoRef.current.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      toast({
        title: 'Camera Error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopPostCamera = () => {
    if (postCameraStream) {
      postCameraStream.getTracks().forEach(track => track.stop());
      setPostCameraStream(null);
    }
    setShowPostCamera(false);
  };

  const capturePostPhoto = async () => {
    if (!postVideoRef.current || !postCanvasRef.current) return;

    const video = postVideoRef.current;
    const canvas = postCanvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      setUploadingPostPhoto(true);
      stopPostCamera();

      try {
        const file = new File([blob], `post_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const result = await uploadImage(file);
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const fullUrl = `${backendUrl}${result.url}`;
        setNewPostImage(fullUrl);
        toast({ title: 'Photo added!', description: 'Ready to post' });
      } catch (err) {
        console.error('Upload error:', err);
        toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
      } finally {
        setUploadingPostPhoto(false);
      }
    }, 'image/jpeg', 0.85);
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
        message: message.trim() || null,
        selfie_url: selfieImage || null
      };

      const result = await checkInAtLocation(checkInData);
      setMyCheckIn(result);
      localStorage.setItem(`checkin_${slug}`, JSON.stringify(result));
      setShowCheckInModal(false);
      setSelfieImage(null); // Reset selfie for next time
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
        author_selfie: myCheckIn.selfie_url || null,
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
      {/* Admin Bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white py-2 px-4 z-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Admin Mode - Location: {location?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  size="sm" 
                  onClick={handleSaveLocation}
                  className="bg-green-600 hover:bg-green-700 h-8"
                >
                  <Save className="w-3 h-3 mr-1" />
                  Save Changes
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { setEditMode(false); setEditingLocation(null); }}
                  className="border-white text-white hover:bg-white/20 h-8"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button 
                size="sm" 
                onClick={handleEditLocation}
                className="bg-white text-red-600 hover:bg-gray-100 h-8"
                data-testid="edit-location-btn"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Location
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => navigate('/admin')}
              className="text-white hover:bg-white/20 h-8"
            >
              Dashboard
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleAdminLogout}
              className="text-white hover:bg-white/20 h-8"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Location Inline Panel */}
      {editMode && editingLocation && (
        <div className={`bg-slate-800 border-b border-red-600/50 p-4 ${isAdmin ? 'mt-12' : ''}`}>
          <div className="container mx-auto">
            <h3 className="text-lg font-bold text-white mb-4">Edit Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Name</label>
                <Input
                  value={editingLocation.name}
                  onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Address</label>
                <Input
                  value={editingLocation.address}
                  onChange={(e) => setEditingLocation({ ...editingLocation, address: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Phone</label>
                <Input
                  value={editingLocation.phone}
                  onChange={(e) => setEditingLocation({ ...editingLocation, phone: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Reservation Phone</label>
                <Input
                  value={editingLocation.reservation_phone || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, reservation_phone: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Online Ordering URL</label>
                <Input
                  value={editingLocation.online_ordering || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, online_ordering: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Review Link</label>
                <Input
                  value={editingLocation.review_link || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, review_link: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  data-testid="location-detail-review-link-input"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Directions Link</label>
                <Input
                  value={editingLocation.directions_link || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, directions_link: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  data-testid="location-detail-directions-link-input"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Image URL</label>
                <Input
                  value={editingLocation.image || ''}
                  onChange={(e) => setEditingLocation({ ...editingLocation, image: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Weekly Specials Section */}
            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-semibold text-white">Weekly Specials</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    const newSpecials = [...(editingLocation.weekly_specials || []), { day: '', special: '', time: '' }];
                    setEditingLocation({ ...editingLocation, weekly_specials: newSpecials });
                  }}
                  className="bg-green-600 hover:bg-green-700 h-8"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Special
                </Button>
              </div>
              
              <div className="space-y-3">
                {(editingLocation.weekly_specials || []).map((special, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <select
                        value={special.day}
                        onChange={(e) => {
                          const newSpecials = [...editingLocation.weekly_specials];
                          newSpecials[index].day = e.target.value;
                          setEditingLocation({ ...editingLocation, weekly_specials: newSpecials });
                        }}
                        className="w-full h-10 px-3 rounded-md bg-slate-900 border border-slate-700 text-white text-sm"
                      >
                        <option value="">Select Day</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                      </select>
                    </div>
                    <div className="flex-[2]">
                      <Input
                        value={special.special}
                        onChange={(e) => {
                          const newSpecials = [...editingLocation.weekly_specials];
                          newSpecials[index].special = e.target.value;
                          setEditingLocation({ ...editingLocation, weekly_specials: newSpecials });
                        }}
                        placeholder="Special description..."
                        className="bg-slate-900 border-slate-700 text-white text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        value={special.time || ''}
                        onChange={(e) => {
                          const newSpecials = [...editingLocation.weekly_specials];
                          newSpecials[index].time = e.target.value;
                          setEditingLocation({ ...editingLocation, weekly_specials: newSpecials });
                        }}
                        placeholder="Time (e.g., 5pm-8pm)"
                        className="bg-slate-900 border-slate-700 text-white text-sm"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newSpecials = editingLocation.weekly_specials.filter((_, i) => i !== index);
                        setEditingLocation({ ...editingLocation, weekly_specials: newSpecials });
                      }}
                      className="text-red-500 hover:bg-red-500/20 h-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                {(!editingLocation.weekly_specials || editingLocation.weekly_specials.length === 0) && (
                  <p className="text-slate-500 text-sm text-center py-2">No specials added yet. Click "Add Special" to create one.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-red-600/50 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Check In</h2>
                <Button variant="ghost" size="sm" onClick={() => { setShowCheckInModal(false); stopCamera(); setSelfieImage(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <p className="text-slate-300 mb-6">
                Join the vibe at <span className="text-red-500 font-semibold">{location.name}</span>! 
                Let others know you're here.
              </p>

              {/* Selfie Section */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Camera className="w-4 h-4 inline mr-1" /> Take a Selfie
                </label>
                
                {!showCamera && !selfieImage && (
                  <button
                    onClick={startCamera}
                    className="w-full h-32 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-red-500 hover:bg-slate-800/50 transition-all"
                    data-testid="start-camera-btn"
                  >
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="text-slate-400 text-sm">Tap to take a selfie</span>
                  </button>
                )}

                {showCamera && (
                  <div className="relative rounded-xl overflow-hidden bg-black">
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full aspect-square object-cover mirror"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                      <Button
                        onClick={stopCamera}
                        variant="outline"
                        size="sm"
                        className="bg-slate-900/80 border-slate-600 text-white"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={captureSelfie}
                        className="bg-red-600 hover:bg-red-700 text-white px-6"
                        data-testid="capture-selfie-btn"
                      >
                        <Camera className="w-4 h-4 mr-2" /> Capture
                      </Button>
                    </div>
                  </div>
                )}

                {uploadingSelfie && (
                  <div className="w-full h-32 rounded-xl bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-slate-400 text-sm">Uploading...</span>
                    </div>
                  </div>
                )}

                {selfieImage && !uploadingSelfie && (
                  <div className="relative">
                    <img 
                      src={selfieImage} 
                      alt="Your selfie" 
                      className="w-full aspect-square object-cover rounded-xl border-2 border-green-500"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        onClick={retakeSelfie}
                        size="sm"
                        className="bg-slate-900/80 hover:bg-slate-800 text-white"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" /> Retake
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <span>✓</span> Selfie ready!
                    </div>
                  </div>
                )}

                {cameraError && (
                  <p className="text-red-400 text-sm mt-2">{cameraError}</p>
                )}
              </div>

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
                <label className="block text-sm font-medium text-slate-300 mb-2">Pick Your Avatar (fallback)</label>
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
                disabled={isLoading || uploadingSelfie}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg"
                data-testid="checkin-submit-btn"
              >
                {isLoading ? 'Checking in...' : `Check In ${selfieImage ? '📸' : selectedEmoji}`}
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
            className="max-h-32 md:max-h-40 w-auto mx-auto mb-3 object-contain cursor-pointer"
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
        ) : location?.check_in_enabled !== false ? (
          <Button onClick={() => setShowCheckInModal(true)} className="w-full mb-4 bg-red-600 hover:bg-red-700 text-white h-14 text-lg" data-testid="checkin-button">
            <LogIn className="w-5 h-5 mr-2" />
            Check In to Join the Vibe
          </Button>
        ) : null}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {/* Social Wall Tab - Always shown if enabled */}
          {(location?.social_wall_enabled !== false) && (
            <Button
              onClick={() => setActiveTab('wall')}
              variant={activeTab === 'wall' ? 'default' : 'outline'}
              className={activeTab === 'wall' ? 'bg-red-600' : 'border-slate-600 text-slate-300'}
              data-testid="tab-wall"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Wall
            </Button>
          )}
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
          {/* DJ Tips Tab - Only shown if enabled for this location */}
          {location?.dj_tips_enabled && (
            <Button
              onClick={() => setActiveTab('dj')}
              variant={activeTab === 'dj' ? 'default' : 'outline'}
              className={activeTab === 'dj' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}
              data-testid="tab-dj"
            >
              <Music className="w-4 h-4 mr-2" />
              Tip DJ
            </Button>
          )}
          {/* Tip Staff Tab - Only shown if enabled for this location */}
          {location?.tip_staff_enabled && (
            <Button
              onClick={() => setActiveTab('tipstaff')}
              variant={activeTab === 'tipstaff' ? 'default' : 'outline'}
              className={activeTab === 'tipstaff' ? 'bg-amber-600' : 'border-slate-600 text-slate-300'}
              data-testid="tab-tipstaff"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Tip Staff
            </Button>
          )}
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
                          {user.selfie_url ? (
                            <img src={user.selfie_url} alt={user.display_name} className="w-7 h-7 rounded-full object-cover border border-slate-600" />
                          ) : (
                            <span className="text-xl">{user.avatar_emoji}</span>
                          )}
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
                    {myCheckIn.selfie_url ? (
                      <img src={myCheckIn.selfie_url} alt="You" className="w-10 h-10 rounded-full object-cover border-2 border-green-500" />
                    ) : (
                      <span className="text-2xl">{myCheckIn.avatar_emoji}</span>
                    )}
                    <div className="flex-1">
                      <Textarea
                        placeholder="What's happening at F&F?"
                        value={newPostText}
                        onChange={(e) => setNewPostText(e.target.value)}
                        className="bg-slate-900 border-slate-700 text-white mb-2 min-h-[80px]"
                        maxLength={280}
                        data-testid="post-textarea"
                      />
                      
                      {/* Photo Preview */}
                      {newPostImage && (
                        <div className="relative mb-3 inline-block">
                          <img src={newPostImage} alt="Preview" className="max-w-full max-h-40 object-cover rounded-lg border border-slate-600" />
                          <button 
                            onClick={() => setNewPostImage('')} 
                            className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 shadow-lg"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}

                      {/* Camera Capture for Post */}
                      {showPostCamera && (
                        <div className="mb-3 rounded-lg overflow-hidden bg-black relative">
                          <video 
                            ref={postVideoRef}
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full max-h-60 object-cover"
                          />
                          <canvas ref={postCanvasRef} className="hidden" />
                          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                            <Button
                              onClick={stopPostCamera}
                              variant="outline"
                              size="sm"
                              className="bg-slate-900/80 border-slate-600 text-white"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={capturePostPhoto}
                              className="bg-red-600 hover:bg-red-700 text-white px-6"
                              data-testid="capture-post-photo-btn"
                            >
                              <Camera className="w-4 h-4 mr-2" /> Capture
                            </Button>
                          </div>
                        </div>
                      )}

                      {uploadingPostPhoto && (
                        <div className="mb-3 h-32 rounded-lg bg-slate-800 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <span className="text-slate-400 text-sm">Uploading photo...</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-2">
                        {/* Take Photo Button */}
                        {!showPostCamera && !newPostImage && (
                          <Button
                            onClick={startPostCamera}
                            variant="outline"
                            size="sm"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            data-testid="take-photo-btn"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Take Photo
                          </Button>
                        )}
                        {(showPostCamera || newPostImage) && <div />}
                        
                        <Button 
                          onClick={handlePostMessage} 
                          disabled={postingMessage || !newPostText.trim() || showPostCamera}
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
                      {/* Author avatar - selfie or emoji */}
                      {post.author_selfie ? (
                        <img 
                          src={post.author_selfie} 
                          alt={post.author_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-slate-600 flex-shrink-0"
                        />
                      ) : (
                        <span className="text-2xl flex-shrink-0">{post.author_emoji}</span>
                      )}
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
                          {user.selfie_url ? (
                            <img src={user.selfie_url} alt={user.display_name} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <span className="text-xl">{user.avatar_emoji}</span>
                          )}
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

        {/* Tip Staff Tab */}
        {activeTab === 'tipstaff' && location?.tip_staff_enabled && (
          <TipStaffTab myCheckIn={myCheckIn} locationSlug={slug} toast={toast} />
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
                  onClick={() => {
                    const directionsUrl = location.directions_link || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`;
                    window.open(directionsUrl, '_blank');
                  }}
                  className="w-full bg-red-600 hover:bg-red-700"
                  data-testid="location-directions-button"
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
                    <a href={`tel:${location.phone}`} className="flex items-center gap-3 text-slate-300 hover:text-red-400" data-testid="location-phone-link">
                      <Phone className="w-4 h-4 text-red-500" />
                      {location.phone}
                    </a>
                    <div className="flex items-center gap-3 text-slate-300" data-testid="location-address">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{location.address}</span>
                    </div>
                    {location.review_link && (
                      <Button
                        onClick={() => window.open(location.review_link, '_blank')}
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        data-testid="location-review-button"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Leave a Review
                      </Button>
                    )}
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
