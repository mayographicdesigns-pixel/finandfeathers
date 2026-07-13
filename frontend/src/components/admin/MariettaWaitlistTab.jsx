import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Download, RefreshCw, Trash2, MapPin } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const MariettaWaitlistTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${window.location.origin}/api/admin/marietta-waitlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.entries || []);
    } catch (err) {
      toast({ title: 'Error loading waitlist', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWaitlist(); }, []);

  const downloadCsv = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${window.location.origin}/api/admin/marietta-waitlist/export.csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'marietta-waitlist.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'CSV downloaded', description: `${rows.length} signup(s)` });
    } catch (err) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    }
  };

  const deleteRow = async (entryId) => {
    if (!window.confirm('Remove this entry?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${window.location.origin}/api/admin/marietta-waitlist/${entryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows((prev) => prev.filter((r) => r.id !== entryId));
      toast({ title: 'Entry deleted' });
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="space-y-4" data-testid="marietta-waitlist-tab">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          Marietta Grand-Opening Waitlist ({rows.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCsv}
            disabled={rows.length === 0}
            className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
            data-testid="marietta-download-csv-btn"
          >
            <Download className="w-4 h-4 mr-2" /> Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWaitlist}
            className="border-slate-600 text-slate-300"
            data-testid="marietta-refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-white text-center py-8">Loading waitlist...</div>
      ) : rows.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            No one on the waitlist yet — share the homepage banner and the signups will land here.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs text-slate-200">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Phone</th>
                  <th className="px-3 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-left">Signed Up</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-700 hover:bg-slate-700/30"
                    data-testid={`marietta-row-${r.id}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap font-medium">{r.name}</td>
                    <td className="px-3 py-2">
                      <a href={`mailto:${r.email}`} className="text-blue-400 hover:underline">{r.email}</a>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-400">
                      {r.phone ? <a href={`tel:${r.phone}`} className="text-blue-400 hover:underline">{r.phone}</a> : '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-500">{r.referral_source || '—'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-slate-400">{fmtDate(r.created_at)}</td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => deleteRow(r.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete entry"
                        data-testid={`marietta-delete-${r.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MariettaWaitlistTab;
