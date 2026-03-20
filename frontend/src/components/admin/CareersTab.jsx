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

  if (loading) return <div className="text-white text-center py-8">Loading applications...</div>;

  const counts = {};
  applications.forEach(a => { counts[a.status || 'new'] = (counts[a.status || 'new'] || 0) + 1; });

  return (
    <div className="space-y-4" data-testid="careers-tab">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-white">
          Job Applications ({applications.length})
        </h3>
        <Button variant="outline" size="sm" onClick={fetchApplications} className="border-slate-600 text-slate-300" data-testid="careers-refresh-btn">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
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
