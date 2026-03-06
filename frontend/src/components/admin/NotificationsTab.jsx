import React, { useState, useEffect } from 'react';
import { Bell, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import { sendPushNotification, getNotificationHistory } from '../../services/api';

const NotificationsTab = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getNotificationHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch notification history');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !body) {
      toast({ title: 'Error', description: 'Title and message are required', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const result = await sendPushNotification({ title, body, url, send_to_all: true });
      toast({ title: 'Success', description: `Sent to ${result.result.sent} subscribers` });
      setTitle('');
      setBody('');
      setUrl('/');
      fetchHistory();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Send Push Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <Input
              placeholder="Notification Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              required
            />
            <Textarea
              placeholder="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              rows={3}
              required
            />
            <Input
              placeholder="Click URL (e.g., /menu)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <Button
              type="submit"
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-700"
              data-testid="send-notification-button"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send to All Subscribers'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-white font-semibold mb-3">Recent Notifications</h3>
        {history.length === 0 ? (
          <p className="text-slate-400 text-sm">No notifications sent yet</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((notif, index) => (
              <Card key={index} className="bg-slate-800/30 border-slate-700/50">
                <CardContent className="p-3">
                  <p className="text-white font-medium text-sm">{notif.title}</p>
                  <p className="text-slate-400 text-xs">{notif.body}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {new Date(notif.sent_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
