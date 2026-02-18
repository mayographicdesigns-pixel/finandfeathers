import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Coins, Camera, History, Gift, Calendar, 
  Instagram, Twitter, Facebook, ArrowLeft, Edit2, 
  Save, X, Plus, Trash2, CreditCard, Sparkles, Music, Wine, Upload
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';
import {
  getUserProfile,
  getUserProfileByEmail,
  createUserProfile,
  updateUserProfile,
  purchaseTokens,
  getTokenBalance,
  getTokenHistory,
  getUserVisits,
  getUserGallerySubmissions,
  submitGalleryPhoto,
  uploadImage,
  uploadProfilePhoto
} from '../services/api';

const MyAccountPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const profilePhotoInputRef = useRef(null);
  
  // Token state
  const [purchaseAmount, setPurchaseAmount] = useState(5);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tokenHistory, setTokenHistory] = useState([]);
  
  // History state
  const [visits, setVisits] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Photo upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      // Check localStorage for user info
      const savedUser = localStorage.getItem('ff_user_info');
      const savedProfileId = localStorage.getItem('ff_user_profile_id');
      
      if (savedProfileId) {
        // Try to load existing profile
        const existingProfile = await getUserProfile(savedProfileId);
        if (existingProfile) {
          setProfile(existingProfile);
          setEditedProfile(existingProfile);
          loadAdditionalData(existingProfile.id);
          setIsLoading(false);
          return;
        }
      }
      
      if (savedUser) {
        const userInfo = JSON.parse(savedUser);
        // Try to find by email
        if (userInfo.email) {
          const existingProfile = await getUserProfileByEmail(userInfo.email);
          if (existingProfile) {
            localStorage.setItem('ff_user_profile_id', existingProfile.id);
            setProfile(existingProfile);
            setEditedProfile(existingProfile);
            loadAdditionalData(existingProfile.id);
            setIsLoading(false);
            return;
          }
        }
        
        // Create new profile with saved info
        const newProfile = await createUserProfile({
          name: userInfo.name || 'Guest',
          phone: userInfo.phone || null,
          email: userInfo.email || null,
          avatar_emoji: '😊'
        });
        localStorage.setItem('ff_user_profile_id', newProfile.id);
        setProfile(newProfile);
        setEditedProfile(newProfile);
        loadAdditionalData(newProfile.id);
      } else {
        // No saved user - redirect to home or show signup prompt
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdditionalData = async (userId) => {
    try {
      const [historyData, visitsData, submissionsData] = await Promise.all([
        getTokenHistory(userId),
        getUserVisits(userId),
        getUserGallerySubmissions(userId)
      ]);
      setTokenHistory(historyData);
      setVisits(visitsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editedProfile) return;
    
    try {
      const updated = await updateUserProfile(profile.id, {
        name: editedProfile.name,
        phone: editedProfile.phone,
        email: editedProfile.email,
        avatar_emoji: editedProfile.avatar_emoji,
        birthdate: editedProfile.birthdate,
        anniversary: editedProfile.anniversary,
        special_dates: editedProfile.special_dates,
        instagram_handle: editedProfile.instagram_handle,
        facebook_handle: editedProfile.facebook_handle,
        twitter_handle: editedProfile.twitter_handle,
        tiktok_handle: editedProfile.tiktok_handle
      });
      setProfile(updated);
      setEditedProfile(updated);
      setIsEditing(false);
      toast({ title: 'Profile Updated', description: 'Your profile has been saved' });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: 'Error', description: 'Failed to save profile', variant: 'destructive' });
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setUploadingProfilePhoto(true);
    try {
      const result = await uploadProfilePhoto(profile.id, file);
      const photoUrl = `${process.env.REACT_APP_BACKEND_URL}${result.url}`;
      
      // Update local state
      setProfile(prev => ({ ...prev, profile_photo_url: photoUrl }));
      setEditedProfile(prev => ({ ...prev, profile_photo_url: photoUrl }));
      
      toast({ title: 'Photo Updated!', description: 'Your profile photo has been saved' });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const handlePurchaseTokens = async () => {
    if (!profile || purchaseAmount < 1) return;
    
    setIsPurchasing(true);
    try {
      const result = await purchaseTokens(profile.id, purchaseAmount);
      setProfile(prev => ({ ...prev, token_balance: result.new_balance }));
      setTokenHistory(prev => [result.purchase, ...prev]);
      toast({ 
        title: 'Tokens Purchased!', 
        description: `You now have ${result.new_balance} F&F tokens` 
      });
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    
    setUploadingPhoto(true);
    try {
      // Upload the image first
      const uploadResult = await uploadImage(file);
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${uploadResult.url}`;
      
      // Submit to gallery
      await submitGalleryPhoto(profile.id, imageUrl, photoCaption || null);
      
      // Refresh submissions
      const newSubmissions = await getUserGallerySubmissions(profile.id);
      setSubmissions(newSubmissions);
      setPhotoCaption('');
      
      toast({ title: 'Photo Submitted!', description: 'Your photo has been added to the gallery' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const addSpecialDate = () => {
    setEditedProfile(prev => ({
      ...prev,
      special_dates: [...(prev.special_dates || []), { name: '', date: '' }]
    }));
  };

  const removeSpecialDate = (index) => {
    setEditedProfile(prev => ({
      ...prev,
      special_dates: prev.special_dates.filter((_, i) => i !== index)
    }));
  };

  const updateSpecialDate = (index, field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      special_dates: prev.special_dates.map((d, i) => 
        i === index ? { ...d, [field]: value } : d
      )
    }));
  };

  // Emoji picker options
  const emojiOptions = ['😊', '😎', '🤠', '🥳', '😇', '🤩', '👨', '👩', '🧑', '👴', '👵', '🎉'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading your profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="bg-slate-900 border-red-600/30 w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Create Your Profile</h2>
            <p className="text-slate-400 mb-6">
              Visit a location and check in to create your F&F profile
            </p>
            <Button 
              onClick={() => navigate('/locations')}
              className="bg-red-600 hover:bg-red-700"
              data-testid="find-location-btn"
            >
              Find a Location
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hidden file input for profile photo */}
      <input
        type="file"
        ref={profilePhotoInputRef}
        onChange={handleProfilePhotoUpload}
        accept="image/*"
        className="hidden"
        data-testid="profile-photo-input"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-red-900/40 to-slate-950 pt-6 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            {/* Profile Photo/Avatar */}
            <div className="relative group">
              {profile.profile_photo_url ? (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-red-500"
                  data-testid="profile-photo"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-4xl border-2 border-slate-700">
                  {profile.avatar_emoji}
                </div>
              )}
              {/* Upload overlay */}
              <button
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={uploadingProfilePhoto}
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                data-testid="upload-photo-btn"
              >
                {uploadingProfilePhoto ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white" data-testid="profile-name">
                {profile.name}
              </h1>
              <p className="text-slate-400">{profile.email || 'No email set'}</p>
            </div>
            
            {/* Token Balance */}
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl px-4 py-2 text-center">
              <div className="flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-amber-100" />
                <span className="text-2xl font-bold text-white" data-testid="token-balance">
                  {profile.token_balance || 0}
                </span>
              </div>
              <div className="text-xs text-amber-100">F&F Tokens</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-slate-800/50 border border-slate-700 mb-6">
            <TabsTrigger 
              value="profile" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-profile"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="tokens" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-tokens"
            >
              <Coins className="w-4 h-4 mr-2" />
              Tokens
            </TabsTrigger>
            <TabsTrigger 
              value="photos" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-photos"
            >
              <Camera className="w-4 h-4 mr-2" />
              Photos
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex-1 data-[state=active]:bg-red-600"
              data-testid="tab-history"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Personal Information</CardTitle>
                {!isEditing ? (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-red-400 hover:text-red-300"
                    data-testid="edit-profile-btn"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProfile(profile);
                      }}
                      className="text-slate-400"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSaveProfile}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="save-profile-btn"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Photo */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {profile.profile_photo_url ? (
                      <img 
                        src={profile.profile_photo_url} 
                        alt={profile.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-red-500"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-4xl border-2 border-slate-700">
                        {profile.avatar_emoji}
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => profilePhotoInputRef.current?.click()}
                        disabled={uploadingProfilePhoto}
                        className="border-slate-600 text-slate-300"
                        data-testid="change-photo-btn"
                      >
                        {uploadingProfilePhoto ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            {profile.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500">JPG, PNG, GIF, WebP up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Avatar Emoji (fallback) */}
                {isEditing && (
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Fallback Avatar (shown if no photo)</label>
                    <div className="flex gap-2 flex-wrap">
                      {emojiOptions.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => setEditedProfile(prev => ({ ...prev, avatar_emoji: emoji }))}
                          className={`text-2xl p-2 rounded-lg transition-all ${
                            editedProfile?.avatar_emoji === emoji 
                              ? 'bg-red-600 scale-110' 
                              : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Name</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile?.name || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-name"
                    />
                  ) : (
                    <p className="text-white">{profile.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Phone</label>
                  {isEditing ? (
                    <Input
                      value={editedProfile?.phone || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="(555) 123-4567"
                      data-testid="input-phone"
                    />
                  ) : (
                    <p className="text-white">{profile.phone || 'Not set'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedProfile?.email || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      placeholder="you@example.com"
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-white">{profile.email || 'Not set'}</p>
                  )}
                </div>

                {/* Birthdate */}
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-1">
                    <Calendar className="w-4 h-4" />
                    Birthdate
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile?.birthdate || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, birthdate: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-birthdate"
                    />
                  ) : (
                    <p className="text-white">
                      {profile.birthdate 
                        ? new Date(profile.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Not set'}
                    </p>
                  )}
                </div>

                {/* Anniversary */}
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-1">
                    <Gift className="w-4 h-4" />
                    Anniversary
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedProfile?.anniversary || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, anniversary: e.target.value }))}
                      className="bg-slate-800 border-slate-600 text-white"
                      data-testid="input-anniversary"
                    />
                  ) : (
                    <p className="text-white">
                      {profile.anniversary 
                        ? new Date(profile.anniversary).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Not set'}
                    </p>
                  )}
                </div>

                {/* Special Dates */}
                <div>
                  <label className="text-sm text-slate-400 flex items-center gap-1 mb-2">
                    <Sparkles className="w-4 h-4" />
                    Special Dates
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(editedProfile?.special_dates || []).map((sd, idx) => (
                        <div key={idx} className="flex gap-2">
                          <Input
                            value={sd.name}
                            onChange={e => updateSpecialDate(idx, 'name', e.target.value)}
                            placeholder="Event name"
                            className="bg-slate-800 border-slate-600 text-white flex-1"
                          />
                          <Input
                            type="date"
                            value={sd.date}
                            onChange={e => updateSpecialDate(idx, 'date', e.target.value)}
                            className="bg-slate-800 border-slate-600 text-white w-40"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSpecialDate(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addSpecialDate}
                        className="border-slate-600 text-slate-300"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Date
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {(profile.special_dates || []).length > 0 ? (
                        profile.special_dates.map((sd, idx) => (
                          <p key={idx} className="text-white">
                            {sd.name}: {new Date(sd.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        ))
                      ) : (
                        <p className="text-slate-500">No special dates set</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Instagram */}
                <div className="flex items-center gap-3">
                  <Instagram className="w-5 h-5 text-pink-500" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.instagram_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, instagram_handle: e.target.value }))}
                      placeholder="@username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.instagram_handle || 'Not set'}</span>
                  )}
                </div>

                {/* Facebook */}
                <div className="flex items-center gap-3">
                  <Facebook className="w-5 h-5 text-blue-500" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.facebook_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, facebook_handle: e.target.value }))}
                      placeholder="username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.facebook_handle || 'Not set'}</span>
                  )}
                </div>

                {/* Twitter */}
                <div className="flex items-center gap-3">
                  <Twitter className="w-5 h-5 text-sky-500" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.twitter_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, twitter_handle: e.target.value }))}
                      placeholder="@username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.twitter_handle || 'Not set'}</span>
                  )}
                </div>

                {/* TikTok */}
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-white" />
                  {isEditing ? (
                    <Input
                      value={editedProfile?.tiktok_handle || ''}
                      onChange={e => setEditedProfile(prev => ({ ...prev, tiktok_handle: e.target.value }))}
                      placeholder="@username"
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  ) : (
                    <span className="text-white">{profile.tiktok_handle || 'Not set'}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-4">
            {/* Balance Card */}
            <Card className="bg-gradient-to-r from-amber-900/50 to-amber-800/30 border-amber-600/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-200 text-sm mb-1">Your Balance</p>
                    <div className="flex items-center gap-2">
                      <Coins className="w-8 h-8 text-amber-400" />
                      <span className="text-4xl font-bold text-white">{profile.token_balance || 0}</span>
                      <span className="text-amber-200">tokens</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-200/70 text-xs">$1 = 10 tokens</p>
                    <p className="text-amber-200/70 text-xs">Use for tips & drinks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Tokens */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Buy F&F Tokens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 20].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setPurchaseAmount(amount)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        purchaseAmount === amount
                          ? 'border-amber-500 bg-amber-500/20'
                          : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-lg font-bold text-white">${amount}</div>
                      <div className="text-xs text-slate-400">{amount * 10} tokens</div>
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="1"
                    value={purchaseAmount}
                    onChange={e => setPurchaseAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-slate-800 border-slate-600 text-white w-24"
                    data-testid="token-amount-input"
                  />
                  <span className="text-slate-400">= {purchaseAmount * 10} tokens</span>
                </div>

                <Button
                  onClick={handlePurchaseTokens}
                  disabled={isPurchasing}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  data-testid="purchase-tokens-btn"
                >
                  {isPurchasing ? 'Processing...' : `Purchase ${purchaseAmount * 10} Tokens for $${purchaseAmount}`}
                </Button>
                
                <p className="text-xs text-slate-500 text-center">
                  Tokens are used to tip DJs and send drinks to friends at F&F locations
                </p>
              </CardContent>
            </Card>

            {/* Token History */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Token History</CardTitle>
              </CardHeader>
              <CardContent>
                {tokenHistory.length > 0 ? (
                  <div className="space-y-2">
                    {tokenHistory.map((tx, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {tx.payment_method === 'gift' ? (
                            <Gift className="w-5 h-5 text-pink-400" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-green-400" />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {tx.payment_method === 'gift' ? 'Gift from Admin' : 'Purchase'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-bold">+{tx.tokens_purchased}</p>
                          {tx.payment_method !== 'gift' && (
                            <p className="text-xs text-slate-400">${tx.amount_usd}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No token history yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            {/* Upload Photo */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Submit a Photo to Gallery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  placeholder="Add a caption (optional)"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                    data-testid="photo-upload-input"
                  />
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-red-500 transition-colors">
                    {uploadingPhoto ? (
                      <p className="text-slate-400">Uploading...</p>
                    ) : (
                      <>
                        <Camera className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                        <p className="text-slate-400">Click to upload a photo</p>
                        <p className="text-xs text-slate-500 mt-1">JPG, PNG, GIF up to 5MB</p>
                      </>
                    )}
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* My Submissions */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">My Gallery Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {submissions.map((sub, idx) => (
                      <div key={idx} className="relative group">
                        <img 
                          src={sub.image_url} 
                          alt={sub.caption || 'Gallery submission'}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {sub.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-lg">
                            <p className="text-white text-xs truncate">{sub.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No photos submitted yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{profile.total_visits || 0}</p>
                  <p className="text-xs text-slate-400">Visits</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{profile.total_posts || 0}</p>
                  <p className="text-xs text-slate-400">Posts</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-white">{profile.total_photos || 0}</p>
                  <p className="text-xs text-slate-400">Photos</p>
                </CardContent>
              </Card>
            </div>

            {/* Visit History */}
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent Visits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visits.length > 0 ? (
                  <div className="space-y-2">
                    {visits.map((visit, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{visit.location_name}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(visit.checked_in_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No visit history yet. Check in at a location!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyAccountPage;
