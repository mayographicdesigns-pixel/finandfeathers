import React from 'react';
import OptimizedImage from '../OptimizedImage';

// Signature Mixes - House blends at base price $30
const signatureMixes = [
  {
    name: 'Sunset Blvd',
    description: 'Skittles candy, lemon & pineapple party mix',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/51anrg2g_Gemini_Generated_Image_srh128srh128srh1.png',
  },
  {
    name: 'Cali Dreamin',
    description: 'Kiwi, blueberry & pineapple tropical dream',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/828uk6yt_Gemini_Generated_Image_sz4e4asz4e4asz4e.png',
  },
  {
    name: 'Beverly Hills',
    description: 'Strawberry, guava, lime & pineapple luxury',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/dksx1m1e_Gemini_Generated_Image_w8vprgw8vprgw8vp.png',
  },
  {
    name: 'Melrose',
    description: 'Watermelon, peach & pineapple summer vibes',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/idquq3ku_Gemini_Generated_Image_onkt1yonkt1yonkt.png',
  },
  {
    name: 'Pacific Coast Highway',
    description: 'Pineapple, orange & lemon citrus cruise',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/h43wzlz6_Gemini_Generated_Image_ofrxceofrxceofrx.png',
  },
  {
    name: '405',
    description: 'Mango, peach & lemon tropical blend',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/zy0j7rvb_Gemini_Generated_Image_9hlklc9hlklc9hlk.png',
  },
  {
    name: 'LAX',
    description: 'Watermelon, orange, mango & mint refresh',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/6chmahcx_Gemini_Generated_Image_yp09bdyp09bdyp09.png',
  },
  {
    name: 'Muholland Dr',
    description: 'Citrus paradise with orange, mango, grapefruit & fresh mint',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/km0oj38j_Gemini_Generated_Image_wdubqrwdubqrwdub%20%281%29.png',
  },
  {
    name: 'Crenshaw',
    description: 'Sweet mix of mango, grapes, orange, cherry & mixed berries',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/j2fy1cjc_Gemini_Generated_Image_y9kh6by9kh6by9kh.png',
  },
  {
    name: 'East L.A.',
    description: 'Blueberry guava lemon with pineapple undertones',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/7bvsbgix_Gemini_Generated_Image_kzztmzkzztmzkzzt%20%282%29.png',
  }
];

// Premium Flavors - +$5 extra charge ($35 total)
const premiumFlavors = [
  {
    name: 'Love 66',
    description: 'A romantic blend of passion fruit, watermelon & exotic fruits',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/6izjnsdm_Gemini_Generated_Image_1pfziw1pfziw1pfz.png',
  },
  {
    name: 'Blue Mist',
    description: 'Cool blueberry with a refreshing mint finish',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/828uk6yt_Gemini_Generated_Image_sz4e4asz4e4asz4e.png',
  },
  {
    name: 'Mighty Freeze',
    description: 'Tropical blend of pineapple, guava, strawberry & lime with an icy finish',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/6izjnsdm_Gemini_Generated_Image_1pfziw1pfziw1pfz.png',
  },
  {
    name: 'Pirates Cove',
    description: 'A mysterious blend of tropical fruits with a hint of spice',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/14nokmuv_Gemini_Generated_Image_qwfwlhqwfwlhqwfw.png',
  },
  {
    name: 'Big Boy',
    description: 'Fruity explosion with mango, peach, grapes, cherry & tropical fruits',
    image: 'https://customer-assets.emergentagent.com/job_572e1efb-eb0d-4035-8b28-47988e001b8e/artifacts/14nokmuv_Gemini_Generated_Image_qwfwlhqwfwlhqwfw.png',
  }
];

const HookahSection = () => {
  return (
    <div className="space-y-6" data-testid="hookah-section">
      {/* Safety & Policies - At the top */}
      <div className="bg-slate-800/40 border border-red-900/30 rounded-xl p-6" data-testid="hookah-policies">
        <h4 className="text-lg font-semibold text-white mb-3">Safety & Policies</h4>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li><span className="font-semibold text-white">Refills:</span> Refill flavors are available a la carte upon request.</li>
          <li><span className="font-semibold text-white">Handling:</span> For the safety of our servers and customers, please do not attempt to light, refill, or reposition the hookah.</li>
          <li><span className="font-semibold text-white">Liability:</span> Fin & Feathers is not responsible for any loss or damage caused by the use of hookah.</li>
          <li><span className="font-semibold text-red-400">Health Warning:</span> Shisha is a tobacco product containing nicotine and is addictive. Exposure to secondhand smoke puts one at risk for cancer, heart, and lung diseases.</li>
        </ul>
      </div>

      {/* Header with pricing */}
      <div className="bg-gradient-to-r from-purple-900/50 to-slate-800/50 border border-purple-500/30 rounded-xl p-6">
        <h3 className="text-3xl font-bold text-white mb-2" data-testid="hookah-title">HOOKAH</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="bg-slate-800/60 rounded-lg px-4 py-2">
            <span className="text-slate-400">Base Price:</span>
            <span className="text-white font-bold ml-2">$30</span>
          </div>
          <div className="bg-purple-800/60 rounded-lg px-4 py-2">
            <span className="text-purple-300">Premium Flavors:</span>
            <span className="text-white font-bold ml-2">+$5</span>
          </div>
          <div className="bg-amber-800/60 rounded-lg px-4 py-2">
            <span className="text-amber-300">Happy Hour:</span>
            <span className="text-white font-bold ml-2">$20</span>
            <span className="text-amber-400 ml-1">Mon-Fri 12pm-8pm</span>
          </div>
        </div>
      </div>

      {/* Signature Mixes - Base price $30 */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hookah-signature-section">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">~</span>
          <h4 className="text-xl font-bold text-white">SIGNATURE MIXES</h4>
          <span className="bg-slate-600 text-white text-xs px-2 py-1 rounded-full">$30</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4" data-testid="hookah-signature-grid">
          {signatureMixes.map((flavor) => (
            <div key={flavor.name} className="bg-slate-900/60 border border-slate-700/40 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all" data-testid={`hookah-card-${flavor.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <OptimizedImage 
                src={flavor.image} 
                alt={flavor.name} 
                className="h-40"
                quality={75}
              />
              <div className="p-3">
                <h5 className="text-white font-semibold mb-1">{flavor.name}</h5>
                <p className="text-slate-400 text-xs line-clamp-2">{flavor.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium Flavors - +$5 extra */}
      <div className="bg-slate-800/40 border border-purple-500/30 rounded-xl p-6" data-testid="hookah-premium-section">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">*</span>
          <h4 className="text-xl font-bold text-white">PREMIUM FLAVORS</h4>
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">+$5</span>
        </div>
        <p className="text-slate-400 text-sm mb-4">Love 66, Blue Mist, Mighty Freeze, Pirates Cove, Big Boy & New Flavors</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4" data-testid="hookah-premium-grid">
          {premiumFlavors.map((flavor) => (
            <div key={flavor.name} className="bg-slate-900/60 border border-purple-500/30 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all" data-testid={`hookah-card-${flavor.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <OptimizedImage 
                src={flavor.image} 
                alt={flavor.name} 
                className="h-40"
                quality={75}
              />
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <h5 className="text-white font-semibold">{flavor.name}</h5>
                  <span className="text-purple-400 font-bold text-xs">+$5</span>
                </div>
                <p className="text-slate-400 text-xs line-clamp-2">{flavor.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Build Your Own & Classic Flavors List */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-6" data-testid="hookah-build-your-own">
        <h4 className="text-lg font-semibold text-white mb-3">Build Your Own Blend</h4>
        <p className="text-slate-400 text-sm mb-4">Mix and match from our selection of classic flavors:</p>
        <div className="space-y-3 text-slate-300 text-sm">
          <div>
            <p className="font-semibold text-white mb-1">Fruit & Berry</p>
            <p>Strawberry, Blueberry, Pineapple, Mango, Peach, White Peach, Kiwi, Grapefruit, Orange, Watermelon, and Guava.</p>
          </div>
          <div>
            <p className="font-semibold text-white mb-1">Mints & Specialty</p>
            <p>Mint, Lemon Mint, Orange Mint, Gum Mint, Duo Maloney, Moonshine, Skittles Crush, and Yummy Gummy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HookahSection;
