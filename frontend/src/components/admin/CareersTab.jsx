import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Check, RefreshCw, Download, ChevronDown, ChevronUp, Briefcase, MapPin, Clock, FileText, Camera, User, Phone, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { toast } from '../../hooks/use-toast';
import { getJobApplications, updateApplicationStatus, deleteApplication } from '../../services/api';

const STATUS_OPTIONS = ['new', 'reviewed', 'interviewed', 'hired', 'rejected'];
const STATUS_COLORS = {
  new: 'bg-green-600',
  reviewed: 'bg-blue-600',
  interviewed: 'bg-yellow-600',
  hired: 'bg-emerald-600',
  rejected: 'bg-red-700'
};

const CareersTab = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await getJobApplications();
      setApplications(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateApplicationStatus(id, status);
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast({ title: 'Updated', description: `Status changed to ${status}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this application?')) return;
    try {
      await deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
      toast({ title: 'Deleted', description: 'Application removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = filterStatus === 'all' ? applications : applications.filter(a => a.status === filterStatus);

  // CSV download — sorted by location, then position, then name. Excludes resumes/headshots (URLs).
  const downloadCsv = () => {
    if (filtered.length === 0) {
      toast({ title: 'Nothing to download', description: 'No applications match the current filter' });
      return;
    }
    const sorted = [...filtered].sort((a, b) => {
      const locCmp = (a.location || '').localeCompare(b.location || '');
      if (locCmp !== 0) return locCmp;
      const posCmp = (a.position || '').localeCompare(b.position || '');
      if (posCmp !== 0) return posCmp;
      return (a.name || '').localeCompare(b.name || '');
    });
    const fmtDate = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    };
    const fmtAvail = (av) => {
      if (!av || typeof av !== 'object') return '';
      return Object.entries(av)
        .filter(([, v]) => v && (Array.isArray(v) ? v.length : true))
        .map(([day, slots]) => `${day}: ${Array.isArray(slots) ? slots.join('/') : slots}`)
        .join('; ');
    };
    const escape = (val) => {
      const s = val == null ? '' : String(val);
      // Escape per RFC 4180: wrap in quotes if it contains ", , or newlines; double inner quotes.
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const headers = [
      'Location',
      'Position',
      'Category',
      'Name',
      'Email',
      'Phone',
      '21+',
      'Status',
      'Instagram',
      'Facebook',
      'TikTok',
      'Availability',
      'Resume',
      'Headshot',
      'Applied At',
    ];
    const rows = sorted.map((a) => [
      a.location,
      a.position,
      a.position_category,
      a.name,
      a.email,
      a.phone,
      a.is_21_or_over === 'yes' ? 'Yes' : a.is_21_or_over === 'no' ? 'No' : '',
      a.status || 'new',
      a.social_links?.instagram || '',
      a.social_links?.facebook || '',
      a.social_links?.tiktok || '',
      fmtAvail(a.availability),
      a.resume_url || '',
      a.headshot_url || '',
      fmtDate(a.created_at),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `applications-${filterStatus}-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'CSV downloaded', description: `${rows.length} application(s) sorted by location & position` });
  };

  if (loading) return <div className="text-white text-center py-8">Loading applications...</div>;

  const counts = {};
  applications.forEach(a => { counts[a.status || 'new'] = (counts[a.status || 'new'] || 0) + 1; });

  return (
    <div className="space-y-4" data-testid="careers-tab">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-white">
          Job Applications ({applications.length})
        </h3>
        <div className="flex flex-wrap gap-2 items-center">
          {/* List/Cards toggle */}
          <div className="flex bg-slate-800 rounded-md overflow-hidden border border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'cards' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
              data-testid="view-cards-btn"
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
              data-testid="view-list-btn"
            >
              List
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsv}
            className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
            data-testid="careers-download-csv-btn"
          >
            <Download className="w-4 h-4 mr-2" /> Download CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchApplications} className="border-slate-600 text-slate-300" data-testid="careers-refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Status counts */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          data-testid="filter-all"
        >
          All ({applications.length})
        </button>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${filterStatus === s ? `${STATUS_COLORS[s]} text-white` : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            data-testid={`filter-${s}`}
          >
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            {applications.length === 0 ? 'No applications received yet' : `No ${filterStatus} applications`}
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        // Compact list view — sorted by location, then position, then name
        <Card className="bg-slate-800/50 border-slate-700" data-testid="applications-list-view">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-slate-200">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Location</th>
                  <th className="px-3 py-2 text-left">Position</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-center">21+</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Applied</th>
                </tr>
              </thead>
              <tbody>
                {[...filtered]
                  .sort((a, b) => {
                    const locCmp = (a.location || '').localeCompare(b.location || '');
                    if (locCmp !== 0) return locCmp;
                    const posCmp = (a.position || '').localeCompare(b.position || '');
                    if (posCmp !== 0) return posCmp;
                    return (a.name || '').localeCompare(b.name || '');
                  })
                  .map((app, idx, arr) => {
                    const prev = idx > 0 ? arr[idx - 1] : null;
                    const newLocation = !prev || prev.location !== app.location;
                    const created = app.created_at
                      ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '';
                    return (
                      <tr
                        key={app.id}
                        className={`border-t border-slate-700 hover:bg-slate-700/30 cursor-pointer ${newLocation ? 'border-t-2 border-t-red-600/40' : ''}`}
                        onClick={() => { setViewMode('cards'); setExpandedId(app.id); }}
                        data-testid={`list-row-${app.id}`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-slate-300">
                          {app.location?.replace('Fin & Feathers - ', '') || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium">{app.position}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{app.name}</td>
                        <td className="px-3 py-2 truncate max-w-[180px]">
                          <a href={`mailto:${app.email}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:underline">{app.email}</a>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-400">{app.phone || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          {app.is_21_or_over === 'yes' ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px]">21+</span>
                          ) : app.is_21_or_over === 'no' ? (
                            <span className="px-1.5 py-0.5 rounded bg-red-700 text-white text-[10px]">&lt;21</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white capitalize ${STATUS_COLORS[app.status || 'new']}`}>
                            {app.status || 'new'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-slate-400">{created}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            const createdDate = app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

            return (
              <Card key={app.id} className="bg-slate-800/50 border-slate-700" data-testid={`application-${app.id}`}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium truncate">{app.name}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium text-white capitalize ${STATUS_COLORS[app.status || 'new']}`}>
                          {app.status || 'new'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{app.position}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.location?.replace('Fin & Feathers - ', '')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{createdDate}</span>
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : app.id)} className="text-slate-400 hover:text-white p-1" data-testid={`expand-${app.id}`}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <a href={`mailto:${app.email}`} className="text-blue-400 hover:underline truncate">{app.email}</a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <a href={`tel:${app.phone}`} className="text-slate-300 hover:underline">{app.phone}</a>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <User className="w-4 h-4 text-slate-500" />
                          <span>{app.position_category || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Social */}
                      {app.social_links && (app.social_links.instagram || app.social_links.facebook || app.social_links.tiktok) && (
                        <div className="flex flex-wrap gap-3 text-xs">
                          {app.social_links.instagram && <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">IG: {app.social_links.instagram}</span>}
                          {app.social_links.facebook && <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">FB: {app.social_links.facebook}</span>}
                          {app.social_links.tiktok && <span className="bg-slate-700 px-2 py-1 rounded text-slate-300">TT: {app.social_links.tiktok}</span>}
                        </div>
                      )}

                      {/* Availability */}
                      {app.availability && Object.keys(app.availability).length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Availability</p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(app.availability).filter(([, v]) => v).map(([key]) => (
                              <span key={key} className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px]">{key}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      <div className="flex flex-wrap gap-2">
                        {app.resume_url && (
                          <a
                            href={`${window.location.origin}${app.resume_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs transition-colors"
                            data-testid={`resume-${app.id}`}
                          >
                            <FileText className="w-3 h-3" /> View Resume
                          </a>
                        )}
                        {app.headshot_url && (
                          <a
                            href={`${window.location.origin}${app.headshot_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs transition-colors"
                            data-testid={`headshot-${app.id}`}
                          >
                            <Camera className="w-3 h-3" /> View Headshot
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-700">
                        {STATUS_OPTIONS.filter(s => s !== (app.status || 'new')).map(s => (
                          <Button
                            key={s}
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(app.id, s)}
                            className={`border-slate-600 text-slate-300 hover:bg-slate-700 capitalize text-xs`}
                            data-testid={`status-${s}-${app.id}`}
                          >
                            {s === 'reviewed' && <Eye className="w-3 h-3 mr-1" />}
                            {s === 'hired' && <Check className="w-3 h-3 mr-1" />}
                            {s}
                          </Button>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(app.id)}
                          className="border-red-600 text-red-400 hover:bg-red-900/30 text-xs ml-auto"
                          data-testid={`delete-${app.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CareersTab;
