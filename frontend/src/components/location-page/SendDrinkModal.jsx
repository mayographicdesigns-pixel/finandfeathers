import React from 'react';
import { X, Wine } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';

const DRINK_OPTIONS = [
  { name: 'House Cocktail', emoji: '🍸', price: '$12' },
  { name: 'Beer', emoji: '🍺', price: '$8' },
  { name: 'Wine', emoji: '🍷', price: '$10' },
  { name: 'Shot', emoji: '🥃', price: '$8' },
  { name: 'Margarita', emoji: '🍹', price: '$14' },
  { name: 'Champagne', emoji: '🥂', price: '$15' },
];

const SendDrinkModal = ({
  isOpen,
  onClose,
  recipient,
  selectedDrink,
  onSelectDrink,
  drinkMessage,
  onMessageChange,
  onSend,
  isSending
}) => {
  if (!isOpen || !recipient) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-pink-600/50 w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wine className="w-5 h-5 text-pink-500" />
              Send a Drink
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <p className="text-slate-300 mb-4">
            Sending to <span className="text-2xl">{recipient.avatar_emoji}</span>{' '}
            <span className="text-pink-400 font-semibold">{recipient.display_name}</span>
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Choose a Drink</label>
            <div className="grid grid-cols-2 gap-2">
              {DRINK_OPTIONS.map((drink) => (
                <button
                  key={drink.name}
                  onClick={() => onSelectDrink(drink)}
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
              onChange={(e) => onMessageChange(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              maxLength={100}
              data-testid="drink-message-input"
            />
          </div>

          <Button
            onClick={onSend}
            disabled={isSending || !selectedDrink}
            className="w-full bg-pink-600 hover:bg-pink-700 h-12 text-lg"
            data-testid="send-drink-btn"
          >
            {isSending ? 'Sending...' : `Send ${selectedDrink?.emoji || '🍹'} ${selectedDrink?.name || 'Drink'}`}
          </Button>

          <p className="text-slate-500 text-xs text-center mt-3">
            The drink will be delivered to {recipient.display_name}'s table.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SendDrinkModal;
export { DRINK_OPTIONS };
