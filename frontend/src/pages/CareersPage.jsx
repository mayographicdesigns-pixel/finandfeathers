import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, ArrowRight, Check, Upload, X, Briefcase } from 'lucide-react';

const API_URL = window.location.origin;

const LOCATIONS = [
  'Fin & Feathers - Edgewood (Atlanta)',
  'Fin & Feathers - Midtown (Atlanta)',
  'Fin & Feathers - Douglasville',
  'Fin & Feathers - Riverdale',
  'Fin & Feathers - Valdosta',
  'Fin & Feathers - Albany',
  'Fin & Feathers - Stone Mountain',
  'Fin & Feathers - Las Vegas'
];

const FOH_POSITIONS = ['Floor Manager', 'Bartender', 'Server', 'Hookah', 'Service Assistant/Dish Washer'];
const BOH_POSITIONS = ['Line Cook', 'Utility/Dishwasher', 'Kitchen Manager'];
const PHOTO_REQUIRED_POSITIONS = ['Floor Manager', 'Bartender', 'Server', 'Hookah'];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHIFTS = ['Morning', 'Evening', 'Late Night'];

const CareersPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    location: '',
    position_category: '',
    position: '',
    availability: {},
    resume: null,
    headshot: null
  });

  const [errors, setErrors] = useState({});

  const needsPhoto = PHOTO_REQUIRED_POSITIONS.includes(form.position);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleAvailability = (day, shift) => {
    const key = `${day}-${shift}`;
    setForm(prev => ({
      ...prev,
      availability: { ...prev.availability, [key]: !prev.availability[key] }
    }));
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.name.trim()) errs.name = 'Name is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      if (!form.phone.trim()) errs.phone = 'Phone is required';
    }
    if (s === 2) {
      if (!form.location) errs.location = 'Select a location';
      if (!form.position) errs.position = 'Select a position';
    }
    if (s === 3) {
      if (!form.resume) errs.resume = 'Resume is required';
      if (needsPhoto && !form.headshot) errs.headshot = 'Headshot is required for this position';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleFileChange = (field, file) => {
    if (file && file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, [field]: 'File must be under 10MB' }));
      return;
    }
    updateForm(field, file);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('instagram', form.instagram);
      formData.append('facebook', form.facebook);
      formData.append('tiktok', form.tiktok);
      formData.append('location', form.location);
      formData.append('position_category', form.position_category);
      formData.append('position', form.position);
      formData.append('availability', JSON.stringify(form.availability));
      formData.append('resume', form.resume);
      if (form.headshot) formData.append('headshot', form.headshot);

      const response = await fetch(`${API_URL}/api/careers/apply`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Submission failed');
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4" style={{
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(/home-bg.jpg)',
        backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'repeat-y'
      }}>
        <div className="max-w-md w-full text-center" data-testid="careers-thank-you">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Thank You!</h1>
          <p className="text-slate-300 mb-2">Your application has been received.</p>
          <p className="text-slate-400 text-sm mb-8">
            We'll review your application and get back to you soon. A confirmation has been sent to {form.email}.
          </p>
          <Button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700 text-white px-8">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8" style={{
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(/home-bg.jpg)',
      backgroundSize: '100% auto', backgroundPosition: 'top center', backgroundRepeat: 'repeat-y'
    }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-slate-300 hover:text-white mr-3" data-testid="careers-back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Join Our Team</h1>
            <p className="text-slate-400 text-sm">Fin & Feathers Restaurants</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8" data-testid="careers-progress">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-red-500' : 'bg-slate-700'}`} />
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-xs text-slate-500 mb-6 -mt-6">
          <span className={step >= 1 ? 'text-red-400' : ''}>Your Info</span>
          <span className={step >= 2 ? 'text-red-400' : ''}>Role & Availability</span>
          <span className={step >= 3 ? 'text-red-400' : ''}>Documents</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6">

          {/* STEP 1: Candidate Information */}
          {step === 1 && (
            <div className="space-y-5" data-testid="careers-step-1">
              <h2 className="text-lg font-semibold text-white mb-4">Candidate Information</h2>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Full Name *</label>
                <Input
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                  placeholder="Your full name"
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="careers-name"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => updateForm('email', e.target.value)}
                  placeholder="your@email.com"
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="careers-email"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Phone Number *</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  placeholder="(404) 555-1234"
                  className="bg-slate-800 border-slate-700 text-white"
                  data-testid="careers-phone"
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Social Media (Optional)</h3>
                <div className="space-y-3">
                  <Input
                    value={form.instagram}
                    onChange={e => updateForm('instagram', e.target.value)}
                    placeholder="Instagram handle"
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="careers-instagram"
                  />
                  <Input
                    value={form.facebook}
                    onChange={e => updateForm('facebook', e.target.value)}
                    placeholder="Facebook profile"
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="careers-facebook"
                  />
                  <Input
                    value={form.tiktok}
                    onChange={e => updateForm('tiktok', e.target.value)}
                    placeholder="TikTok handle"
                    className="bg-slate-800 border-slate-700 text-white"
                    data-testid="careers-tiktok"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Role Selection & Availability */}
          {step === 2 && (
            <div className="space-y-5" data-testid="careers-step-2">
              <h2 className="text-lg font-semibold text-white mb-4">Role & Availability</h2>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Preferred Location *</label>
                <select
                  value={form.location}
                  onChange={e => updateForm('location', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  data-testid="careers-location"
                >
                  <option value="">Select a location...</option>
                  {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
                {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Position *</label>
                <select
                  value={form.position}
                  onChange={e => {
                    const pos = e.target.value;
                    const cat = FOH_POSITIONS.includes(pos) ? 'FOH' : 'BOH';
                    updateForm('position', pos);
                    updateForm('position_category', cat);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  data-testid="careers-position"
                >
                  <option value="">Select a position...</option>
                  <optgroup label="Front of House (FOH)">
                    {FOH_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </optgroup>
                  <optgroup label="Back of House (BOH)">
                    {BOH_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </optgroup>
                </select>
                {errors.position && <p className="text-red-400 text-xs mt-1">{errors.position}</p>}
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-3 block">Availability</label>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left text-slate-500 pb-2 pr-2"></th>
                        {SHIFTS.map(s => (
                          <th key={s} className="text-center text-slate-400 pb-2 px-1 font-medium">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DAYS.map(day => (
                        <tr key={day}>
                          <td className="text-slate-300 py-1.5 pr-2 font-medium">{day.slice(0, 3)}</td>
                          {SHIFTS.map(shift => {
                            const key = `${day}-${shift}`;
                            const active = form.availability[key];
                            return (
                              <td key={shift} className="text-center py-1.5 px-1">
                                <button
                                  type="button"
                                  onClick={() => toggleAvailability(day, shift)}
                                  className={`w-8 h-8 rounded-md transition-all ${
                                    active
                                      ? 'bg-red-500/80 text-white'
                                      : 'bg-slate-800 text-slate-600 hover:bg-slate-700'
                                  }`}
                                  data-testid={`avail-${day}-${shift}`}
                                >
                                  {active ? <Check className="w-3 h-3 mx-auto" /> : ''}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Uploads */}
          {step === 3 && (
            <div className="space-y-5" data-testid="careers-step-3">
              <h2 className="text-lg font-semibold text-white mb-4">Documents & Uploads</h2>

              {/* Resume */}
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Resume / CV *</label>
                <div className="relative">
                  {form.resume ? (
                    <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Upload className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{form.resume.name}</p>
                        <p className="text-slate-500 text-xs">{(form.resume.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button onClick={() => updateForm('resume', null)} className="text-slate-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 cursor-pointer hover:border-red-500/50 transition-colors">
                      <Upload className="w-8 h-8 text-slate-500" />
                      <span className="text-slate-400 text-sm">Click to upload resume</span>
                      <span className="text-slate-600 text-xs">PDF, DOC, DOCX (max 10MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={e => handleFileChange('resume', e.target.files[0])}
                        data-testid="careers-resume-input"
                      />
                    </label>
                  )}
                </div>
                {errors.resume && <p className="text-red-400 text-xs mt-1">{errors.resume}</p>}
              </div>

              {/* Headshot - conditional */}
              {needsPhoto && (
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Headshot / Photo *</label>
                  <p className="text-slate-500 text-xs mb-2">Required for {form.position} position</p>
                  <div className="relative">
                    {form.headshot ? (
                      <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-3">
                        <img
                          src={URL.createObjectURL(form.headshot)}
                          alt="Headshot"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{form.headshot.name}</p>
                          <p className="text-slate-500 text-xs">{(form.headshot.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button onClick={() => updateForm('headshot', null)} className="text-slate-500 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-2 bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 cursor-pointer hover:border-red-500/50 transition-colors">
                        <Upload className="w-8 h-8 text-slate-500" />
                        <span className="text-slate-400 text-sm">Click to upload headshot</span>
                        <span className="text-slate-600 text-xs">JPG, PNG (max 10MB)</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={e => handleFileChange('headshot', e.target.files[0])}
                          data-testid="careers-headshot-input"
                        />
                      </label>
                    )}
                  </div>
                  {errors.headshot && <p className="text-red-400 text-xs mt-1">{errors.headshot}</p>}
                </div>
              )}

              {errors.submit && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-slate-800">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep} className="border-slate-700 text-slate-300 hover:text-white" data-testid="careers-prev-btn">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            ) : <div />}

            {step < 3 ? (
              <Button onClick={nextStep} className="bg-red-600 hover:bg-red-700 text-white" data-testid="careers-next-btn">
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-testid="careers-submit-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
                {!submitting && <Check className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareersPage;
