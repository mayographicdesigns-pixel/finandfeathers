import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { getStaffList, transferTokens, getTokenBalance } from '../../services/api';

const STAFF_TIP_AMOUNTS = [10, 20, 50, 100];

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

export default TipStaffTab;
