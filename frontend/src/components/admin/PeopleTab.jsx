import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Search, Trash2, Eye, Check, X, MapPin, Users, Mail, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { updateContactStatus, deleteContact, deleteLoyaltyMember } from '../../services/api';

const API_URL = window.location.origin;

const PeopleTab = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  const fetchPeople = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/people`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPeople(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPeople(); }, []);

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/admin/people/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fin_feathers_contacts.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'CSV file downloaded' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteContact = async (person) => {
    if (!window.confirm(`Delete ${person.name}?`)) return;
    try {
      if (person.source === 'contact') {
        await deleteContact(person.id);
      } else if (person.source === 'loyalty') {
        await deleteLoyaltyMember(person.id);
      }
      setPeople(people.filter(p => p.id !== person.id));
      toast({ title: 'Deleted', description: `${person.name} removed` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (person, status) => {
    if (person.source !== 'contact') return;
    try {
      await updateContactStatus(person.id, status);
      setPeople(people.map(p => p.id === person.id ? { ...p, status } : p));
      toast({ title: 'Updated', description: `Status set to ${status}` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filtered = people.filter(p => {
    const matchesSearch = !search || 
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.phone || '').includes(search);
    const matchesSource = filterSource === 'all' || p.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const sourceIcon = (src) => {
    if (src === 'loyalty') return <Users className="w-3.5 h-3.5 text-green-400" />;
    if (src === 'contact') return <Mail className="w-3.5 h-3.5 text-blue-400" />;
    if (src === 'checkin') return <MapPin className="w-3.5 h-3.5 text-red-400" />;
    return null;
  };

  const sourceLabel = (src) => {
    if (src === 'loyalty') return 'Loyalty';
    if (src === 'contact') return 'Contact';
    if (src === 'checkin') return 'Check-in';
    return src;
  };

  const sourceBadgeColor = (src) => {
    if (src === 'loyalty') return 'bg-green-600/20 text-green-400 border-green-600/30';
    if (src === 'contact') return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
    if (src === 'checkin') return 'bg-red-600/20 text-red-400 border-red-600/30';
    return 'bg-slate-600/20 text-slate-400';
  };

  const statusColor = (status) => {
    if (status === 'new') return 'bg-green-600';
    if (status === 'reviewed') return 'bg-blue-600';
    if (status === 'resolved') return 'bg-slate-600';
    return 'bg-slate-700';
  };

  const counts = {
    all: people.length,
    loyalty: people.filter(p => p.source === 'loyalty').length,
    contact: people.filter(p => p.source === 'contact').length,
    checkin: people.filter(p => p.source === 'checkin').length,
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white" data-testid="people-tab-title">
          All People ({filtered.length})
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-green-600 text-green-400 hover:bg-green-900/30"
            data-testid="export-csv-btn"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPeople} className="border-slate-600 text-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white h-9 text-sm"
            data-testid="people-search-input"
          />
        </div>
        {['all', 'loyalty', 'contact', 'checkin'].map(f => (
          <Button
            key={f}
            size="sm"
            variant={filterSource === f ? 'default' : 'outline'}
            onClick={() => setFilterSource(f)}
            className={filterSource === f
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
            data-testid={`filter-${f}`}
          >
            {f === 'all' ? 'All' : sourceLabel(f)} ({counts[f]})
          </Button>
        ))}
      </div>

      {/* People List */}
      {filtered.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            No people found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((person, idx) => (
            <Card key={`${person.source}-${person.id}-${idx}`} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium truncate">{person.name || 'Unknown'}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${sourceBadgeColor(person.source)}`}>
                        {sourceIcon(person.source)}
                        {sourceLabel(person.source)}
                      </span>
                      {person.source === 'contact' && (
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${statusColor(person.status)}`}>
                          {person.status}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
                      {person.email && <span>{person.email}</span>}
                      {person.phone && <span>{person.phone}</span>}
                      {person.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {person.location}
                        </span>
                      )}
                      {person.date && (
                        <span className="text-slate-500 text-xs">
                          {new Date(person.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {person.message && (
                      <p className="text-slate-300 text-sm mt-1 line-clamp-2">{person.message}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {person.source === 'contact' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(person, 'reviewed')}
                          className="text-blue-400 hover:bg-blue-900/30 h-8 w-8 p-0"
                          title="Mark Reviewed"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(person, 'resolved')}
                          className="text-green-400 hover:bg-green-900/30 h-8 w-8 p-0"
                          title="Mark Resolved"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    {(person.source === 'contact' || person.source === 'loyalty') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteContact(person)}
                        className="text-red-400 hover:bg-red-900/30 h-8 w-8 p-0"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeopleTab;
