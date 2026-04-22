import React from 'react';

const API_URL = window.location.origin;

/**
 * UserAvatar — Shows profile photo if available, falls back to emoji or default icon.
 * @param {string} photoUrl - profile_photo_url from user profile
 * @param {string} emoji - avatar_emoji fallback
 * @param {string} name - user display name (for alt text)
 * @param {string} size - 'sm' (24px) | 'md' (32px) | 'lg' (40px) | 'xl' (48px)
 */
const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base', xl: 'w-12 h-12 text-lg' };

export const UserAvatar = ({ photoUrl, emoji, name, size = 'md', className = '' }) => {
  const sizeClass = sizes[size] || sizes.md;

  if (photoUrl) {
    const src = photoUrl.startsWith('http') ? photoUrl : `${API_URL}${photoUrl}`;
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
        data-testid="user-avatar-photo"
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-slate-800 flex items-center justify-center shrink-0 ${className}`} data-testid="user-avatar-emoji">
      {emoji || '👤'}
    </div>
  );
};

export default UserAvatar;
