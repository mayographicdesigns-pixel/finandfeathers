import React from 'react';
import { BadgeCheck, Briefcase, Award, User } from 'lucide-react';

const RoleBadge = ({ role, staffTitle }) => {
  const roleConfig = {
    admin: { label: 'Admin', color: 'bg-red-600', icon: BadgeCheck },
    management: { label: 'Management', color: 'bg-purple-600', icon: Briefcase },
    staff: { label: staffTitle || 'Staff', color: 'bg-blue-600', icon: Award },
    customer: { label: 'Member', color: 'bg-slate-600', icon: User }
  };

  const config = roleConfig[role] || roleConfig.customer;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default RoleBadge;
