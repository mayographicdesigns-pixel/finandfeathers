import React, { useState, useEffect } from 'react';
import { 
  Calendar, Music, Plus, Edit2, Trash2, MapPin, Clock, 
  RefreshCw, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toast } from '../../hooks/use-toast';
import { 
  getAdminDJProfiles, 
  createAdminDJProfile, 
  updateAdminDJProfile, 
  deleteAdminDJProfile,
  getAdminDJSchedules,
  createAdminDJSchedule,
  updateAdminDJSchedule,
  deleteAdminDJSchedule,
  adminGetLocations
} from '../../services/api';

const DJScheduleTab = () => {
  const [djProfiles, setDjProfiles] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDJForm, setShowDJForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingDJ, setEditingDJ] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [activeView, setActiveView] = useState('schedules');
  
  const [djForm, setDjForm] = useState({
    name: '',
    stage_name: '',
    avatar_emoji: '🎧',
    bio: '',
    photo_url: '',
    cash_app_username: '',
    venmo_username: '',
    apple_pay_phone: ''
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    dj_id: '',
    location_slug: '',
    scheduled_date: '',
    start_time: '21:00',
    end_time: '02:00',
    is_recurring: false,
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [djs, scheds, locs] = await Promise.all([
        getAdminDJProfiles(),
        getAdminDJSchedules(),
        adminGetLocations()
      ]);
      setDjProfiles(djs || []);
      setSchedules(scheds || []);
      setLocations(locs || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSaveDJ = async () => {
    try {
      if (editingDJ) {
        await updateAdminDJProfile(editingDJ.id, djForm);
        toast({ title: "Success", description: "DJ profile updated" });
      } else {
        await createAdminDJProfile(djForm);
        toast({ title: "Success", description: "DJ profile created" });
      }
      setShowDJForm(false);
      setEditingDJ(null);
      setDjForm({ name: '', stage_name: '', avatar_emoji: '🎧', bio: '', photo_url: '', cash_app_username: '', venmo_username: '', apple_pay_phone: '' });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDJ = async (djId) => {
    if (!window.confirm('Delete this DJ? This will also delete all their schedules.')) return;
    try {
      await deleteAdminDJProfile(djId);
      toast({ title: "Success", description: "DJ profile deleted" });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.dj_id || !scheduleForm.location_slug || !scheduleForm.scheduled_date) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      if (editingSchedule) {
        await updateAdminDJSchedule(editingSchedule.id, scheduleForm);
        toast({ title: "Success", description: "Schedule updated" });
      } else {
        await createAdminDJSchedule(scheduleForm);
        toast({ title: "Success", description: "Schedule created" });
      }
      setShowScheduleForm(false);
      setEditingSchedule(null);
      setScheduleForm({ dj_id: '', location_slug: '', scheduled_date: '', start_time: '21:00', end_time: '02:00', is_recurring: false, notes: '' });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await deleteAdminDJSchedule(scheduleId);
      toast({ title: "Success", description: "Schedule deleted" });
      loadData();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getDayName = (dayNum) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[dayNum] || '';
  };

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={activeView === 'schedules' ? 'default' : 'outline'}
          onClick={() => setActiveView('schedules')}
          className={activeView === 'schedules' ? 'bg-amber-600 hover:bg-amber-700' : ''}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedules
        </Button>
        <Button
          variant={activeView === 'djs' ? 'default' : 'outline'}
          onClick={() => setActiveView('djs')}
          className={activeView === 'djs' ? 'bg-purple-600 hover:bg-purple-700' : ''}
        >
          <Music className="w-4 h-4 mr-2" />
          DJ Profiles ({djProfiles.length})
        </Button>
      </div>

      {/* DJ Profiles View */}
      {activeView === 'djs' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">DJ Profiles</h3>
            <Button onClick={() => { setShowDJForm(true); setEditingDJ(null); }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Add DJ
            </Button>
          </div>

          {/* DJ Form Modal */}
          {showDJForm && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{editingDJ ? 'Edit DJ' : 'Add New DJ'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Name *</label>
                    <Input
                      value={djForm.name}
                      onChange={(e) => setDjForm({...djForm, name: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                      placeholder="Real name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Stage Name</label>
                    <Input
                      value={djForm.stage_name}
                      onChange={(e) => setDjForm({...djForm, stage_name: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                      placeholder="DJ name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Emoji</label>
                    <Input
                      value={djForm.avatar_emoji}
                      onChange={(e) => setDjForm({...djForm, avatar_emoji: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Photo URL</label>
                    <Input
                      value={djForm.photo_url}
                      onChange={(e) => setDjForm({...djForm, photo_url: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Bio</label>
                  <Textarea
                    value={djForm.bio}
                    onChange={(e) => setDjForm({...djForm, bio: e.target.value})}
                    className="bg-slate-700 border-slate-600"
                    placeholder="About the DJ..."
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Cash App</label>
                    <Input
                      value={djForm.cash_app_username}
                      onChange={(e) => setDjForm({...djForm, cash_app_username: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                      placeholder="$username"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Venmo</label>
                    <Input
                      value={djForm.venmo_username}
                      onChange={(e) => setDjForm({...djForm, venmo_username: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                      placeholder="@username"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Apple Pay Phone</label>
                    <Input
                      value={djForm.apple_pay_phone}
                      onChange={(e) => setDjForm({...djForm, apple_pay_phone: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowDJForm(false); setEditingDJ(null); }}>Cancel</Button>
                  <Button onClick={handleSaveDJ} className="bg-purple-600 hover:bg-purple-700">
                    {editingDJ ? 'Update DJ' : 'Create DJ'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DJ List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {djProfiles.map(dj => (
              <Card key={dj.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{dj.avatar_emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{dj.stage_name || dj.name}</h4>
                      {dj.stage_name && <p className="text-sm text-slate-400">{dj.name}</p>}
                      {dj.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dj.bio}</p>}
                      {dj.current_location && (
                        <div className="mt-2 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs inline-flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          LIVE at {dj.current_location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingDJ(dj);
                        setDjForm({
                          name: dj.name || '',
                          stage_name: dj.stage_name || '',
                          avatar_emoji: dj.avatar_emoji || '🎧',
                          bio: dj.bio || '',
                          photo_url: dj.photo_url || '',
                          cash_app_username: dj.cash_app_username || '',
                          venmo_username: dj.venmo_username || '',
                          apple_pay_phone: dj.apple_pay_phone || ''
                        });
                        setShowDJForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteDJ(dj.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {djProfiles.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No DJ profiles yet. Add your first DJ above!
            </div>
          )}
        </>
      )}

      {/* Schedules View */}
      {activeView === 'schedules' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">DJ Schedule</h3>
            <Button 
              onClick={() => { setShowScheduleForm(true); setEditingSchedule(null); }} 
              className="bg-amber-600 hover:bg-amber-700"
              disabled={djProfiles.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Schedule
            </Button>
          </div>

          {djProfiles.length === 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4 flex items-center gap-2 text-yellow-500">
                <AlertCircle className="w-5 h-5" />
                <span>You need to add DJ profiles first before creating schedules.</span>
              </CardContent>
            </Card>
          )}

          {/* Schedule Form Modal */}
          {showScheduleForm && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Select DJ *</label>
                    <select
                      value={scheduleForm.dj_id}
                      onChange={(e) => setScheduleForm({...scheduleForm, dj_id: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                    >
                      <option value="">Choose a DJ...</option>
                      {djProfiles.map(dj => (
                        <option key={dj.id} value={dj.id}>
                          {dj.avatar_emoji} {dj.stage_name || dj.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Select Location *</label>
                    <select
                      value={scheduleForm.location_slug}
                      onChange={(e) => setScheduleForm({...scheduleForm, location_slug: e.target.value})}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                    >
                      <option value="">Choose a location...</option>
                      {locations.map(loc => (
                        <option key={loc.slug} value={loc.slug}>{loc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Date *</label>
                    <Input
                      type="date"
                      value={scheduleForm.scheduled_date}
                      onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Start Time</label>
                    <Input
                      type="time"
                      value={scheduleForm.start_time}
                      onChange={(e) => setScheduleForm({...scheduleForm, start_time: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">End Time</label>
                    <Input
                      type="time"
                      value={scheduleForm.end_time}
                      onChange={(e) => setScheduleForm({...scheduleForm, end_time: e.target.value})}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleForm.is_recurring}
                      onChange={(e) => setScheduleForm({...scheduleForm, is_recurring: e.target.checked})}
                      className="w-4 h-4"
                    />
                    Recurring weekly
                  </label>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Notes</label>
                  <Input
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                    className="bg-slate-700 border-slate-600"
                    placeholder="Special event, theme night, etc."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowScheduleForm(false); setEditingSchedule(null); }}>Cancel</Button>
                  <Button onClick={handleSaveSchedule} className="bg-amber-600 hover:bg-amber-700">
                    {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule List */}
          <div className="space-y-3">
            {schedules.map(schedule => (
              <Card key={schedule.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{djProfiles.find(d => d.id === schedule.dj_id)?.avatar_emoji || '🎧'}</div>
                      <div>
                        <h4 className="font-bold text-white">
                          {schedule.dj_stage_name || schedule.dj_name}
                          {schedule.is_recurring && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              Weekly on {getDayName(schedule.day_of_week)}s
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {schedule.location_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(schedule.scheduled_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </span>
                        </div>
                        {schedule.notes && <p className="text-xs text-slate-500 mt-1">{schedule.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingSchedule(schedule);
                          setScheduleForm({
                            dj_id: schedule.dj_id,
                            location_slug: schedule.location_slug,
                            scheduled_date: schedule.scheduled_date,
                            start_time: schedule.start_time,
                            end_time: schedule.end_time,
                            is_recurring: schedule.is_recurring || false,
                            notes: schedule.notes || ''
                          });
                          setShowScheduleForm(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {schedules.length === 0 && djProfiles.length > 0 && (
            <div className="text-center py-8 text-slate-400">
              No schedules yet. Create your first DJ schedule above!
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DJScheduleTab;
