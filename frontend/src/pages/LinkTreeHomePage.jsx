import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MapPin, Phone, Mail, Instagram, Facebook, Twitter, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from '../hooks/use-toast';
import DailyVideoCarousel from '../components/DailyVideoCarousel';

const LinkTreeHomePage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);

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

  const socialLinks = [
    { icon: Instagram, url: 'https://instagram.com/finandfeathers', label: 'Instagram' },
    { icon: Facebook, url: 'https://facebook.com/finandfeathers', label: 'Facebook' },
    { icon: Twitter, url: 'https://twitter.com/finandfeathers', label: 'Twitter' }
  ];

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
            alt="Fin & Feathers Restaurants"
            className="h-32 md:h-40 w-auto mx-auto mb-4"
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
            onClick={() => window.open('https://finandfeathersrestaurants.com/order-online/', '_blank')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Order Online
          </Button>

          <Button
            onClick={() => window.open('https://finandfeathersrestaurants.com/', '_blank')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border-2 border-slate-700 h-14 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Visit Our Website
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

        {/* Social Media Links */}
        <div className="flex justify-center gap-4 mb-8">
          {socialLinks.map((social, index) => (
            <button
              key={index}
              onClick={() => window.open(social.url, '_blank')}
              className="w-12 h-12 rounded-full bg-slate-800 hover:bg-red-600 transition-all duration-300 flex items-center justify-center border border-slate-700 hover:border-red-500"
              aria-label={social.label}
            >
              <social.icon className="w-5 h-5 text-white" />
            </button>
          ))}
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
