import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MapPin, Phone, Mail, Instagram, Facebook, Twitter, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../hooks/use-toast';
import DailyVideoCarousel from '../components/DailyVideoCarousel';
import { signupLoyalty, subscribeToPush, getPublicSocialLinks, getPublicInstagramFeed, getPublicSpecials } from '../services/api';

const LinkTreeHomePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);
  const [socialLinks, setSocialLinks] = useState([]);
  const [instagramFeed, setInstagramFeed] = useState([]);
  const [specials, setSpecials] = useState([]);

  useEffect(() => {
    // Fetch social data
    const fetchSocialData = async () => {
      try {
        const [links, feed, activeSpecials] = await Promise.all([
          getPublicSocialLinks(),
          getPublicInstagramFeed(),
          getPublicSpecials()
        ]);
        setSocialLinks(links);
        setInstagramFeed(feed);
        setSpecials(activeSpecials);
      } catch (err) {
        console.error('Failed to fetch social data:', err);
      }
    };
    fetchSocialData();
  }, []);

  const handleLoyaltySignup = async (e) => {
    e.preventDefault();
    if (!agreeToMarketing) {
      toast({
        title: "Agreement Required",
        description: "Please agree to receive marketing communications to join our loyalty program.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Sign up loyalty member
      const member = await signupLoyalty({
        name,
        email,
        phone: phone || null,
        marketing_consent: agreeToMarketing
      });

      // Subscribe to push notifications
      const pushSubscribed = await subscribeToPush(member.id);

      toast({
        title: "Welcome to Fin & Feathers Loyalty!",
        description: pushSubscribed 
          ? `Thank you ${name}! You'll receive exclusive offers and push notifications.`
          : `Thank you ${name}! Check your email for exclusive offers.`,
      });

      setEmail('');
      setName('');
      setPhone('');
      setAgreeToMarketing(false);
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error.message || "Unable to complete signup. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Default social links if none configured
  const defaultSocialLinks = [
    { platform: 'instagram', url: 'https://instagram.com/finandfeathers', username: '@finandfeathers' },
    { platform: 'facebook', url: 'https://facebook.com/finandfeathers', username: 'Fin & Feathers' },
    { platform: 'twitter', url: 'https://twitter.com/finandfeathers', username: '@finandfeathers' }
  ];

  const displaySocialLinks = socialLinks.length > 0 ? socialLinks : defaultSocialLinks;

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'tiktok': return () => <span className="text-lg">🎵</span>;
      default: return ExternalLink;
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
            alt="Fin & Feathers Restaurants"
            className="max-h-32 md:max-h-40 w-auto mx-auto mb-4 object-contain"
          />
          <p className="text-slate-300 text-sm">
            Elevated dining meets Southern soul
          </p>
        </div>

        {/* Weekly Specials Section */}
        <Card className="mb-6 bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-600/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-bold text-white">This Week's Specials</h2>
            </div>
            {/* Daily Video Carousel */}
            <DailyVideoCarousel />
          </CardContent>
        </Card>

        {/* Advertising/Promo Section - Removed since videos are in weekly specials */}

        {/* Main Link Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => navigate('/menu')}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            View Full Menu
          </Button>

          <Button
            onClick={() => navigate('/locations')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <MapPin className="w-5 h-5 mr-2" />
            Find a Location
          </Button>

          <Button
            onClick={() => navigate('/locations')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Order Online
          </Button>

          <Button
            onClick={() => window.open('https://www.instagram.com/finandfeathers/', '_blank')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <Instagram className="w-5 h-5 mr-2" />
            Social Media
          </Button>

          <Button
            onClick={() => window.open('https://www.google.com/search?q=Fin+%26+Feathers+Restaurants', '_blank')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-2 border-red-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Leave a Review
          </Button>
        </div>

        {/* Contact Information */}
        <Card className="mb-6 bg-slate-800/80 border-slate-700/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Contact Us</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Main Line</p>
                  <a href="tel:+14048555524" className="text-slate-300 text-sm hover:text-red-500 transition-colors">
                    (404) 855-5524
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">Email</p>
                  <a href="mailto:info@finandfeathers.com" className="text-slate-300 text-sm hover:text-red-500 transition-colors">
                    info@finandfeathers.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold text-sm">7 Locations</p>
                  <button 
                    onClick={() => navigate('/locations')}
                    className="text-slate-300 text-sm hover:text-red-500 transition-colors underline"
                  >
                    View all locations
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Program Signup */}
        <Card className="mb-6 bg-gradient-to-br from-red-900/20 to-slate-800/80 border-red-600/30">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Join Our Loyalty Program</h2>
            <p className="text-slate-300 text-sm text-center mb-6">
              Be the first to receive updates on special events, new menu items, exclusive offers, and more!
            </p>
            
            <form onSubmit={handleLoyaltySignup} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                />
              </div>
              
              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                />
              </div>
              
              <div>
                <Input
                  type="tel"
                  placeholder="Phone Number (Optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={agreeToMarketing}
                  onChange={(e) => setAgreeToMarketing(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="marketing" className="text-slate-300 text-xs">
                  By checking this box, you agree to receive marketing communications from Fin & Feathers Restaurants
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold rounded-lg"
              >
                Join Now
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Active Specials */}
        {specials.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-yellow-900/20 to-slate-800/80 border-yellow-600/30">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
                <span className="text-2xl">🎉</span> Current Specials
              </h2>
              <div className="space-y-3">
                {specials.slice(0, 3).map((special) => (
                  <div key={special.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex gap-3">
                      {special.image && (
                        <img src={special.image} alt="" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div>
                        <h3 className="text-white font-semibold">{special.title}</h3>
                        <p className="text-slate-300 text-sm">{special.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Media Feed - 4 Column Grid */}
        <Card className="mb-6 bg-slate-800/80 border-slate-700/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
              <Instagram className="w-5 h-5 text-pink-500" /> Follow Us on Social Media
            </h2>
            
            {/* 4 Column Social Feed Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Instagram Embed 1 */}
              <div className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <iframe 
                  src="https://www.instagram.com/finandfeathers/embed" 
                  className="w-full h-full"
                  style={{ minHeight: '300px', border: 'none' }}
                  scrolling="no"
                  allowTransparency="true"
                  title="Instagram Feed 1"
                ></iframe>
              </div>
              
              {/* Instagram Embed 2 */}
              <div className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <iframe 
                  src="https://www.instagram.com/finandfeathers/embed" 
                  className="w-full h-full"
                  style={{ minHeight: '300px', border: 'none' }}
                  scrolling="no"
                  allowTransparency="true"
                  title="Instagram Feed 2"
                ></iframe>
              </div>
              
              {/* Facebook Embed */}
              <div className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <iframe 
                  src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Ffinandfeathersrestaurants&tabs=timeline&width=340&height=300&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false" 
                  className="w-full h-full"
                  style={{ minHeight: '300px', border: 'none', overflow: 'hidden' }}
                  scrolling="no"
                  allowFullScreen={true}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  title="Facebook Feed"
                ></iframe>
              </div>
              
              {/* Instagram Embed 3 */}
              <div className="bg-white rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
                <iframe 
                  src="https://www.instagram.com/finandfeathers/embed" 
                  className="w-full h-full"
                  style={{ minHeight: '300px', border: 'none' }}
                  scrolling="no"
                  allowTransparency="true"
                  title="Instagram Feed 3"
                ></iframe>
              </div>
            </div>
            
            {/* Follow Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                onClick={() => window.open('https://www.instagram.com/finandfeathers/', '_blank')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                <Instagram className="w-4 h-4 mr-2" />
                Follow on Instagram
              </Button>
              <Button
                onClick={() => window.open('https://www.facebook.com/finandfeathersrestaurants', '_blank')}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Follow on Facebook
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Links */}
        <div className="flex justify-center gap-4 mb-8">
          {displaySocialLinks.map((social, index) => {
            const Icon = getSocialIcon(social.platform);
            return (
              <button
                key={index}
                onClick={() => window.open(social.url, '_blank')}
                className="w-12 h-12 rounded-full bg-slate-800 hover:bg-red-600 transition-all duration-300 flex items-center justify-center border border-slate-700 hover:border-red-500"
                aria-label={social.platform}
              >
                {typeof Icon === 'function' && Icon.prototype ? <Icon className="w-5 h-5 text-white" /> : <Icon />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-xs">
          <p>© 2024 Fin & Feathers Restaurants. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LinkTreeHomePage;
