import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Send, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../hooks/use-toast';
import { sendPushNotification } from '../services/api';

const AdminPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!title || !body) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and message.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const result = await sendPushNotification({
        title,
        body,
        url,
        send_to_all: true
      });

      toast({
        title: "Notifications Sent!",
        description: `Successfully sent to ${result.result.sent} subscribers.`,
      });

      setTitle('');
      setBody('');
      setUrl('/');
    } catch (error) {
      toast({
        title: "Send Failed",
        description: error.message || "Unable to send notifications.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
            alt="Fin & Feathers Restaurants"
            className="h-32 md:h-40 w-auto mx-auto mb-4 cursor-pointer"
            onClick={() => navigate('/')}
          />
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-300 text-sm">Send push notifications to loyalty members</p>
        </div>

        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="mb-6 bg-slate-800/70 border-red-600/50 text-red-500 hover:bg-slate-700 hover:text-red-400 hover:border-red-500 transition-all duration-300"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Push Notification Form */}
        <Card className="bg-slate-800/80 border-slate-700/50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Send Push Notification</h2>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Notification Title
                </label>
                <Input
                  type="text"
                  placeholder="e.g., New Special Available!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Message
                </label>
                <Textarea
                  placeholder="e.g., Check out our Monday special: 50% off lamb chops!"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="text-white text-sm font-medium mb-2 block">
                  Click URL (optional)
                </label>
                <Input
                  type="text"
                  placeholder="/ or /menu or /locations"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                />
                <p className="text-slate-400 text-xs mt-1">
                  Where users will go when they click the notification
                </p>
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold"
              >
                <Send className="w-5 h-5 mr-2" />
                {sending ? 'Sending...' : 'Send to All Subscribers'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-white font-semibold mb-2">📱 Push Notification Tips</h3>
            <ul className="text-slate-300 text-sm space-y-2">
              <li>• Keep titles short and engaging (under 50 characters)</li>
              <li>• Messages should be clear and action-oriented</li>
              <li>• Test with your own device first</li>
              <li>• Best times to send: lunch (11am-1pm) and dinner (5pm-7pm)</li>
              <li>• Don't send too frequently - quality over quantity</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
