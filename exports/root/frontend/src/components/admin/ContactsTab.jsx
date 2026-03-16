import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Check, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { toast } from '../../hooks/use-toast';
import { getContacts, updateContactStatus, deleteContact } from '../../services/api';

const ContactsTab = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateContactStatus(id, status);
      setContacts(contacts.map(c => c.id === id ? { ...c, status } : c));
      toast({ title: 'Success', description: 'Status updated' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await deleteContact(id);
      setContacts(contacts.filter(c => c.id !== id));
      toast({ title: 'Deleted', description: 'Contact removed' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  const statusColors = {
    new: 'bg-green-600',
    reviewed: 'bg-blue-600',
    resolved: 'bg-slate-600'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Contact Submissions ({contacts.length})</h3>
        <Button variant="outline" size="sm" onClick={fetchContacts} className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            No contact submissions yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-white font-medium">{contact.name}</p>
                    <p className="text-slate-400 text-sm">{contact.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs text-white ${statusColors[contact.status] || statusColors.new}`}>
                    {contact.status || 'new'}
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{contact.message}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(contact.id, 'reviewed')}
                    className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                    data-testid={`contact-review-${contact.id}`}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Mark Reviewed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(contact.id, 'resolved')}
                    className="border-green-600 text-green-400 hover:bg-green-900/30"
                    data-testid={`contact-resolve-${contact.id}`}
                  >
                    <Check className="w-3 h-3 mr-1" /> Resolved
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteContact(contact.id)}
                    className="border-red-600 text-red-400 hover:bg-red-900/30"
                    data-testid={`contact-delete-${contact.id}`}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactsTab;
