import React from 'react';

const MenuHeroSection = ({ heroHtml, todayName, todaysSpecial }) => {
  return (
    <div className="relative mb-8">
      {/* Hero Section */}
      <div className="text-center py-8" data-testid="menu-hero-section">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight">
          OUR <span className="text-red-500">MENU</span>
        </h1>
        <p 
          className="text-slate-400 text-lg max-w-2xl mx-auto"
          dangerouslySetInnerHTML={{ __html: heroHtml }}
        />
      </div>

      {/* Today's Special Banner */}
      {todaysSpecial && (
        <div 
          className="bg-gradient-to-r from-red-900/50 via-amber-900/50 to-red-900/50 border border-red-600/30 rounded-xl p-4 mb-6"
          data-testid="todays-special-banner"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{todaysSpecial.emoji}</span>
              <div>
                <h3 className="text-xl font-bold text-white">{todayName}'s Special</h3>
                <p className="text-amber-400 font-semibold">{todaysSpecial.name}</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-300 text-sm">{todaysSpecial.description}</p>
              <p className="text-red-400 text-sm font-semibold">{todaysSpecial.hours}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuHeroSection;
