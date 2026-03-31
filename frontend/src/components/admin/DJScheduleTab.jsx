import React, { useState, useEffect } from 'react';
import { 
  Calendar, Music, Plus, Edit2, Trash2, MapPin, Clock, 
  RefreshCw, AlertCircle, FileText, Upload, CheckCircle2
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
  adminGetLocations,
  bulkImportDJSchedule
} from '../../services/api';

// Parse pasted schedule text into structured entries
function parseBulkText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const entries = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayAbbrevs = { 'Mon': 'Monday', 'Tue': 'Tuesday', 'Tues': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday', 'Thur': 'Thursday', 'Thurs': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday' };
  const timePattern = /(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?|All\s*Day)/i;

  for (const line of lines) {
    // Skip header/location lines
    if (/^(EDGEWOOD|ALBANY|MIDTOWN|STONE|DOUGLAS|RIVER|VALDOSTA|LAS\s*VEGAS|HIBACHI|\(|week\s+of)/i.test(line)) continue;
    if (/^[-=]+$/.test(line)) continue;

    // Try pattern: "Day: DJ Name Time - Time"
    let dayFound = null;
    let remaining = line;

    for (const day of days) {
      const dayRegex = new RegExp(`^${day}[:\\s-]+`, 'i');
      if (dayRegex.test(remaining)) {
        dayFound = day;
        remaining = remaining.replace(dayRegex, '').trim();
        break;
      }
    }
    if (!dayFound) {
      for (const [abbr, full] of Object.entries(dayAbbrevs)) {
        const abbrRegex = new RegExp(`^${abbr}[:\\s.-]+`, 'i');
        if (abbrRegex.test(remaining)) {
          dayFound = full;
          remaining = remaining.replace(abbrRegex, '').trim();
          break;
        }
      }
    }

    // Try pattern: "DJ Name - Day Time" (day embedded)
    if (!dayFound) {
      for (const day of days) {
        const idx = remaining.toLowerCase().indexOf(day.toLowerCase());
        if (idx > 0) {
          dayFound = day;
          remaining = remaining.substring(0, idx).trim() + ' ' + remaining.substring(idx + day.length).trim();
          break;
        }
      }
    }

    if (!dayFound) continue;

    // Extract time slot
    const timeMatch = remaining.match(timePattern);
    let timeSlot = '';
    let djName = remaining;

    if (timeMatch) {
      timeSlot = timeMatch[0].trim();
      djName = remaining.replace(timeMatch[0], '').trim();
    }

    // Clean DJ name
    djName = djName.replace(/^[-–:]+|[-–:]+$/g, '').trim();
    if (!djName) continue;

    entries.push({
      dj_name: djName,
      day_of_week: dayFound,
      time_slot: timeSlot,
      notes: ''
    });
  }
  return entries;
}

const DAYS_ORDER = { 'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6 };

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
  
  // Bulk import state
  const [bulkText, setBulkText] = useState('');
  const [bulkLocation, setBulkLocation] = useState('');
  const [bulkWeekLabel, setBulkWeekLabel] = useState('');
  const [bulkReplace, setBulkReplace] = useState(true);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  
  const [djForm, setDjForm] = useState({
    name: '', stage_name: '', avatar_emoji: '🎧', bio: '', photo_url: '',
    cash_app_username: '', venmo_username: '', apple_pay_phone: ''
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    dj_id: '', location_slug: '', scheduled_date: '',
    start_time: '21:00', end_time: '02:00', is_recurring: false, notes: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [djs, scheds, locs] = await Promise.all([
        getAdminDJProfiles(), getAdminDJSchedules(), adminGetLocations()
      ]);
      setDjProfiles(djs || []);
      setSchedules(scheds || []);
      setLocations(locs || []);
    } catch {
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

  // Bulk import handlers
  const handleParseBulk = () => {
    const entries = parseBulkText(bulkText);
    setParsedEntries(entries);
    if (entries.length === 0) {
      toast({ title: "No entries found", description: "Check your format. Example:\nTuesday: DJ Flexxrated 8pm - 12am", variant: "destructive" });
    }
  };

  const handleRemoveParsedEntry = (idx) => {
    setParsedEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleBulkSave = async () => {
    if (!bulkLocation || !bulkWeekLabel || parsedEntries.length === 0) {
      toast({ title: "Error", description: "Select a location, week label, and parse entries first", variant: "destructive" });
      return;
    }
    setBulkSaving(true);
    try {
      const result = await bulkImportDJSchedule({
        location_slug: bulkLocation,
        week_label: bulkWeekLabel,
        entries: parsedEntries,
        replace_existing: bulkReplace
      });
      toast({ title: "Imported!", description: `${result.inserted} schedules added${bulkReplace ? `, ${result.deleted} old removed` : ''}` });
      setBulkText('');
      setParsedEntries([]);
      loadData();
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setBulkSaving(false);
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
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={activeView === 'schedules' ? 'default' : 'outline'}
          onClick={() => setActiveView('schedules')}
          className={activeView === 'schedules' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          data-testid="dj-tab-schedules"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedules
        </Button>
        <Button
          variant={activeView === 'djs' ? 'default' : 'outline'}
          onClick={() => setActiveView('djs')}
          className={activeView === 'djs' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          data-testid="dj-tab-profiles"
        >
          <Music className="w-4 h-4 mr-2" />
          DJ Profiles ({djProfiles.length})
        </Button>
        <Button
          variant={activeView === 'bulk' ? 'default' : 'outline'}
          onClick={() => setActiveView('bulk')}
          className={activeView === 'bulk' ? 'bg-green-600 hover:bg-green-700' : ''}
          data-testid="dj-tab-bulk"
        >
          <FileText className="w-4 h-4 mr-2" />
          Bulk Import
        </Button>
      </div>

      {/* ==================== DJ PROFILES VIEW ==================== */}
      {activeView === 'djs' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">DJ Profiles</h3>
            <Button onClick={() => { setShowDJForm(true); setEditingDJ(null); }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Add DJ
            </Button>
          </div>

          {showDJForm && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white">{editingDJ ? 'Edit DJ' : 'Add New DJ'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Name *</label>
                    <Input value={djForm.name} onChange={(e) => setDjForm({...djForm, name: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="Real name" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Stage Name</label>
                    <Input value={djForm.stage_name} onChange={(e) => setDjForm({...djForm, stage_name: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="DJ name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Emoji</label>
                    <Input value={djForm.avatar_emoji} onChange={(e) => setDjForm({...djForm, avatar_emoji: e.target.value})} className="bg-slate-700 border-slate-600" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Photo URL</label>
                    <Input value={djForm.photo_url} onChange={(e) => setDjForm({...djForm, photo_url: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Bio</label>
                  <Textarea value={djForm.bio} onChange={(e) => setDjForm({...djForm, bio: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="About the DJ..." rows={2} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Cash App</label>
                    <Input value={djForm.cash_app_username} onChange={(e) => setDjForm({...djForm, cash_app_username: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="$username" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Venmo</label>
                    <Input value={djForm.venmo_username} onChange={(e) => setDjForm({...djForm, venmo_username: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="@username" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Apple Pay Phone</label>
                    <Input value={djForm.apple_pay_phone} onChange={(e) => setDjForm({...djForm, apple_pay_phone: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="Phone number" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowDJForm(false); setEditingDJ(null); }}>Cancel</Button>
                  <Button onClick={handleSaveDJ} className="bg-purple-600 hover:bg-purple-700">{editingDJ ? 'Update DJ' : 'Create DJ'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingDJ(dj);
                      setDjForm({ name: dj.name || '', stage_name: dj.stage_name || '', avatar_emoji: dj.avatar_emoji || '🎧', bio: dj.bio || '', photo_url: dj.photo_url || '', cash_app_username: dj.cash_app_username || '', venmo_username: dj.venmo_username || '', apple_pay_phone: dj.apple_pay_phone || '' });
                      setShowDJForm(true);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteDJ(dj.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {djProfiles.length === 0 && (
            <div className="text-center py-8 text-slate-400">No DJ profiles yet. Add your first DJ above!</div>
          )}
        </>
      )}

      {/* ==================== SCHEDULES VIEW ==================== */}
      {activeView === 'schedules' && (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">DJ Schedule</h3>
            <Button onClick={() => { setShowScheduleForm(true); setEditingSchedule(null); }} className="bg-amber-600 hover:bg-amber-700" disabled={djProfiles.length === 0}>
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

          {showScheduleForm && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white">{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Select DJ *</label>
                    <select value={scheduleForm.dj_id} onChange={(e) => setScheduleForm({...scheduleForm, dj_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                      <option value="">Choose a DJ...</option>
                      {djProfiles.map(dj => (<option key={dj.id} value={dj.id}>{dj.avatar_emoji} {dj.stage_name || dj.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Select Location *</label>
                    <select value={scheduleForm.location_slug} onChange={(e) => setScheduleForm({...scheduleForm, location_slug: e.target.value})} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                      <option value="">Choose a location...</option>
                      {locations.map(loc => (<option key={loc.slug} value={loc.slug}>{loc.name}</option>))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-slate-400">Date *</label>
                    <Input type="date" value={scheduleForm.scheduled_date} onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})} className="bg-slate-700 border-slate-600" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Start Time</label>
                    <Input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm({...scheduleForm, start_time: e.target.value})} className="bg-slate-700 border-slate-600" />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">End Time</label>
                    <Input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm({...scheduleForm, end_time: e.target.value})} className="bg-slate-700 border-slate-600" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={scheduleForm.is_recurring} onChange={(e) => setScheduleForm({...scheduleForm, is_recurring: e.target.checked})} className="w-4 h-4" />
                    Recurring weekly
                  </label>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Notes</label>
                  <Input value={scheduleForm.notes} onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="Special event, theme night, etc." />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowScheduleForm(false); setEditingSchedule(null); }}>Cancel</Button>
                  <Button onClick={handleSaveSchedule} className="bg-amber-600 hover:bg-amber-700">{editingSchedule ? 'Update Schedule' : 'Create Schedule'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

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
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{schedule.location_name}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(schedule.scheduled_date)}</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
                        </div>
                        {schedule.notes && <p className="text-xs text-slate-500 mt-1">{schedule.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingSchedule(schedule);
                        setScheduleForm({ dj_id: schedule.dj_id, location_slug: schedule.location_slug, scheduled_date: schedule.scheduled_date, start_time: schedule.start_time, end_time: schedule.end_time, is_recurring: schedule.is_recurring || false, notes: schedule.notes || '' });
                        setShowScheduleForm(true);
                      }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteSchedule(schedule.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {schedules.length === 0 && djProfiles.length > 0 && (
            <div className="text-center py-8 text-slate-400">No schedules yet. Create your first DJ schedule above!</div>
          )}
        </>
      )}

      {/* ==================== BULK IMPORT VIEW ==================== */}
      {activeView === 'bulk' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-green-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Bulk Import Weekly Schedule</h3>
              <p className="text-sm text-slate-400">Paste a full week's DJ lineup and we'll parse it automatically</p>
            </div>
          </div>

          {/* Config row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Location *</label>
              <select
                value={bulkLocation}
                onChange={(e) => setBulkLocation(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white"
                data-testid="bulk-location-select"
              >
                <option value="">Choose location...</option>
                {locations.filter(l => l.slug !== 'hibachi-food-truck').map(loc => (
                  <option key={loc.slug} value={loc.slug}>{loc.name?.replace('Fin & Feathers - ', '')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Week Label *</label>
              <Input
                value={bulkWeekLabel}
                onChange={(e) => setBulkWeekLabel(e.target.value)}
                className="bg-slate-700 border-slate-600"
                placeholder="e.g. Week of April 6th"
                data-testid="bulk-week-label"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={bulkReplace}
                  onChange={(e) => setBulkReplace(e.target.checked)}
                  className="w-4 h-4"
                  data-testid="bulk-replace-checkbox"
                />
                Replace existing schedule for this location
              </label>
            </div>
          </div>

          {/* Text area */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Paste Schedule (one entry per line)</label>
                <Textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="bg-slate-700 border-slate-600 font-mono text-sm min-h-[200px]"
                  placeholder={`Example formats:\nTuesday: DJ Flexxrated 8pm - 12am\nWednesday: DJ PJO 8pm - 12am\nFriday: DJ Tay 5pm - 9pm\nFriday: DJ Ron 9pm - 2am\nSaturday: DJ Venom 5pm - 9pm\nSunday: DJ Yobz 2pm - 6pm`}
                  data-testid="bulk-text-input"
                />
              </div>
              <Button
                onClick={handleParseBulk}
                disabled={!bulkText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="bulk-parse-btn"
              >
                <FileText className="w-4 h-4 mr-2" />
                Parse Schedule
              </Button>
            </CardContent>
          </Card>

          {/* Parsed preview */}
          {parsedEntries.length > 0 && (
            <Card className="bg-slate-800/50 border-green-600/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-400 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  {parsedEntries.length} entries parsed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {parsedEntries
                  .sort((a, b) => (DAYS_ORDER[a.day_of_week] ?? 7) - (DAYS_ORDER[b.day_of_week] ?? 7))
                  .map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3" data-testid={`parsed-entry-${idx}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🎧</span>
                      <div>
                        <p className="font-medium text-white">{entry.dj_name}</p>
                        <p className="text-xs text-slate-400">
                          <span className="text-blue-400">{entry.day_of_week}</span>
                          {entry.time_slot && ` • ${entry.time_slot}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveParsedEntry(idx)}
                      className="text-slate-500 hover:text-red-400 p-1"
                      data-testid={`remove-parsed-${idx}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <div className="pt-4 flex gap-3">
                  <Button
                    onClick={handleBulkSave}
                    disabled={bulkSaving || !bulkLocation || !bulkWeekLabel}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                    data-testid="bulk-save-btn"
                  >
                    {bulkSaving ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Save {parsedEntries.length} Entries</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setParsedEntries([])} data-testid="bulk-clear-btn">
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default DJScheduleTab;
