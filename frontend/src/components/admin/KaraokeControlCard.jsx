import React, { useState, useEffect } from 'react';
import { Mic2, Loader2, Power } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from '../../hooks/use-toast';

const API_URL = window.location.origin;

const adminHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const KaraokeControlCard = () => {
  const [locations, setLocations] = useState([]);
  const [statuses, setStatuses] = useState({}); // { slug: { active, dj_id, started_at } }
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({}); // { slug: bool }

  const loadAll = async () => {
    try {
      const locRes = await fetch(`${API_URL}/api/locations`);
      const locs = await locRes.json();
      setLocations(locs);

      const statusEntries = await Promise.all(
        locs.map(async (loc) => {
          try {
            const r = await fetch(`${API_URL}/api/karaoke/status/${loc.slug}`);
            const d = await r.json();
            return [loc.slug, d];
          } catch {
            return [loc.slug, { active: false }];
          }
        })
      );
      setStatuses(Object.fromEntries(statusEntries));
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load karaoke status', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 30000); // refresh every 30s
    return () => clearInterval(id);
  }, []);

  const toggle = async (slug, currentlyActive) => {
    setToggling((t) => ({ ...t, [slug]: true }));
    try {
      const res = await fetch(`${API_URL}/api/karaoke/toggle/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({ active: !currentlyActive, dj_id: 'admin' }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setStatuses((s) => ({ ...s, [slug]: { ...s[slug], active: data.active } }));
      toast({
        title: data.active ? 'Karaoke ON' : 'Karaoke OFF',
        description: `${slug}: karaoke mode ${data.active ? 'enabled' : 'disabled'}`,
      });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setToggling((t) => ({ ...t, [slug]: false }));
    }
  };

  const activeLocations = locations.filter((l) => statuses[l.slug]?.active);

  return (
    <Card className="bg-slate-800/50 border-slate-700 mt-6" data-testid="karaoke-control-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Karaoke Mode Control</h3>
            {activeLocations.length > 0 && (
              <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                {activeLocations.length} LIVE
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs hidden sm:block">Auto-disables nightly at 3am local</p>
        </div>

        {loading ? (
          <div className="text-center py-6">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" />
          </div>
        ) : locations.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No locations configured</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {locations.map((loc) => {
              const status = statuses[loc.slug] || {};
              const isActive = !!status.active;
              const isToggling = !!toggling[loc.slug];
              return (
                <div
                  key={loc.slug}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isActive
                      ? 'bg-purple-900/20 border-purple-500/40'
                      : 'bg-slate-900/50 border-slate-700'
                  }`}
                  data-testid={`karaoke-loc-${loc.slug}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">
                      {loc.name?.replace('Fin & Feathers - ', '') || loc.slug}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-purple-400' : 'text-slate-500'}`}>
                      {isActive ? '● LIVE' : 'Off'}
                    </p>
                  </div>
                  <Button
                    onClick={() => toggle(loc.slug, isActive)}
                    disabled={isToggling}
                    size="sm"
                    className={
                      isActive
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }
                    data-testid={`karaoke-toggle-${loc.slug}`}
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-1" />
                        {isActive ? 'Turn Off' : 'Turn On'}
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KaraokeControlCard;
