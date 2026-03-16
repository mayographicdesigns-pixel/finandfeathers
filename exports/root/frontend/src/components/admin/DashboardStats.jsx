import React from 'react';
import { Users, Mail, UtensilsCrossed, Bell } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const DashboardStats = ({ stats }) => {
  const statItems = [
    { label: 'Loyalty Members', value: stats?.loyalty_members || 0, icon: Users, color: 'text-blue-500' },
    { label: 'New Contacts', value: stats?.new_contacts || 0, icon: Mail, color: 'text-green-500' },
    { label: 'Menu Items', value: stats?.menu_items || 0, icon: UtensilsCrossed, color: 'text-yellow-500' },
    { label: 'Notifications Sent', value: stats?.notifications_sent || 0, icon: Bell, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <Card key={index} className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">{item.label}</p>
                <p className="text-2xl font-bold text-white">{item.value}</p>
              </div>
              <item.icon className={`w-8 h-8 ${item.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;
