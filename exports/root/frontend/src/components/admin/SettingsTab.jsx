import React, { useState, useEffect } from 'react';
import { Coins, Award, Gift } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { toast } from '../../hooks/use-toast';
import { getAdminSettings, updateAdminSettings } from '../../services/api';

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    token_program_enabled: true,
    loyalty_program_enabled: true,
    buy_drink_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getAdminSettings();
      setSettings({
        token_program_enabled: data.token_program_enabled ?? true,
        loyalty_program_enabled: data.loyalty_program_enabled ?? true,
        buy_drink_enabled: data.buy_drink_enabled ?? true
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getSettingLabel = (key) => {
    const labels = {
      'token_program_enabled': 'Token Program',
      'loyalty_program_enabled': 'Loyalty Program',
      'buy_drink_enabled': 'Buy a Drink'
    };
    return labels[key] || key;
  };

  const handleToggle = async (key) => {
    const newValue = !settings[key];
    const updatedSettings = { ...settings, [key]: newValue };
    setSettings(updatedSettings);
    setSaving(true);
    
    try {
      await updateAdminSettings({ [key]: newValue });
      toast({ 
        title: 'Settings Updated', 
        description: `${getSettingLabel(key)} ${newValue ? 'enabled' : 'disabled'}` 
      });
    } catch (error) {
      // Revert on error
      setSettings(settings);
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Program Settings</h3>
      
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 space-y-6">
          {/* Token Program Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Token Program
              </h4>
              <p className="text-slate-400 text-sm mt-1">
                Allow users to earn and spend tokens. When disabled, token features will be hidden from users.
              </p>
            </div>
            <button
              onClick={() => handleToggle('token_program_enabled')}
              disabled={saving}
              className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                settings.token_program_enabled ? 'bg-green-600' : 'bg-slate-600'
              }`}
              data-testid="toggle-token-program"
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  settings.token_program_enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-slate-700" />

          {/* Loyalty Program Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Loyalty Program
              </h4>
              <p className="text-slate-400 text-sm mt-1">
                Enable the loyalty membership features. When disabled, users cannot sign up for loyalty rewards.
              </p>
            </div>
            <button
              onClick={() => handleToggle('loyalty_program_enabled')}
              disabled={saving}
              className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                settings.loyalty_program_enabled ? 'bg-green-600' : 'bg-slate-600'
              }`}
              data-testid="toggle-loyalty-program"
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  settings.loyalty_program_enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="border-t border-slate-700" />

          {/* Buy a Drink Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-medium flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" />
                Buy a Drink
              </h4>
              <p className="text-slate-400 text-sm mt-1">
                Allow users to send drinks to others at locations. When disabled, the "Buy a Drink" feature will be hidden.
              </p>
            </div>
            <button
              onClick={() => handleToggle('buy_drink_enabled')}
              disabled={saving}
              className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                settings.buy_drink_enabled ? 'bg-green-600' : 'bg-slate-600'
              }`}
              data-testid="toggle-buy-drink"
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  settings.buy_drink_enabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <h4 className="text-white font-medium mb-3">Status</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings.token_program_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-300 text-sm">
                Token Program: {settings.token_program_enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings.loyalty_program_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-300 text-sm">
                Loyalty Program: {settings.loyalty_program_enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${settings.buy_drink_enabled ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-300 text-sm">
                Buy a Drink: {settings.buy_drink_enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
