import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { toast } from '../../hooks/use-toast';
import { getLoyaltyMembers, deleteLoyaltyMember } from '../../services/api';

const LoyaltyMembersTab = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await getLoyaltyMembers();
      setMembers(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await deleteLoyaltyMember(id);
      setMembers(members.filter(m => m.id !== id));
      toast({ title: 'Success', description: 'Member deleted' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="text-white text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Loyalty Program Members ({members.length})</h3>
        <Button variant="outline" size="sm" onClick={fetchMembers} className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>
      
      {members.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center text-slate-400">
            No loyalty members yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <Card key={member.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-slate-400 text-sm">{member.email}</p>
                  {member.phone && <p className="text-slate-500 text-xs">{member.phone}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                  data-testid={`delete-member-${member.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoyaltyMembersTab;
