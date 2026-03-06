import React from 'react';
import { X, ChevronLeft, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const DMModal = ({
  isOpen,
  onClose,
  recipient,
  messages,
  myCheckInId,
  newMessage,
  onMessageChange,
  onSend,
  isSending
}) => {
  if (!isOpen || !recipient) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-2xl">{recipient.avatar_emoji}</span>
        <div>
          <p className="text-white font-medium">{recipient.display_name}</p>
          <p className="text-slate-400 text-xs">{recipient.mood || 'Hanging out'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from_checkin_id === myCheckInId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
              msg.from_checkin_id === myCheckInId 
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
        {messages.length === 0 && (
          <p className="text-center text-slate-500 py-8">Start the conversation!</p>
        )}
      </div>

      {/* Input */}
      <div className="bg-slate-900 border-t border-slate-700 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white flex-1"
            onKeyPress={(e) => e.key === 'Enter' && onSend()}
            data-testid="dm-input"
          />
          <Button 
            onClick={onSend} 
            disabled={isSending || !newMessage.trim()}
            className="bg-red-600 hover:bg-red-700"
            data-testid="dm-send-btn"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DMModal;
