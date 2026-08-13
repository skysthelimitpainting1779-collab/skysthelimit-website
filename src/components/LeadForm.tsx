'use client';

import { FormEvent, useMemo, useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck, Upload, X } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { buildEstimateMailto } from '../lib/contact';
import { readUtmParams, trackEvent } from '../lib/analytics';
import { ENV } from '../lib/env';

interface LeadFormProps {
  source: string;
  defaultMarket?: 'Residential' | 'Commercial' | 'Public Sector';
  compact?: boolean;
}

type Status = 'idle' | 'submitting' | 'sent' | 'fallback' | 'error';

const projectOptions = ['Interior', 'Exterior', 'Facility', 'Striping', 'Pavement Marking', 'Other'];
const propertyOptions = ['Single-family home', 'Townhome / condo', 'Retail / storefront', 'Office / commercial', 'Facility / public property', 'Other'];
const timelineOptions = ['ASAP', '1-4 weeks', '1-3 months', 'Planning ahead'];
const budgetOptions = ['Under $2,500', '$2,500-$7,500', '$7,500-$20,000', '$20,000+', 'Not sure yet'];
const contactMethods = ['Call', 'Text', 'Email'];

const labelClass = 'block text-xs font-black text-white mb-2';
const fieldClass = 'w-full border border-white/10 bg-white/5 p-4 text-white outline-none placeholder:text-white/40 transition-[color,background-color,border-color,box-shadow] focus:border-white focus-visible:ring-2 focus-visible:ring-[white]/20 text-base rounded-none';
const selectButtonClass = 'border p-3.5 text-center text-xs font-black transition-[color,background-color,border-color,box-shadow] duration-200 cursor-pointer rounded-none';

export default function LeadForm({ source, defaultMarket = 'Residential', compact = false }: LeadFormProps) {
  const prefersReducedMotion = useReducedMotion();
  const idempotencyKeyRef = useRef('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [validationError, setValidationError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileId: string; name: string }>>([]);

  const [formData, setFormData] = useState({
    market: defaultMarket,
    projectType: '',
    propertyType: '',
    timeline: '',
    budget: '',
    name: '',
    city: '',
    phone: '',
    email: '',
    contactMethod: '',
    projectAddress: '',
    photosUrl: '',
    notes: '',
    bot_honeypot: '',
    website: '',
  });

  const utm = useMemo(() => (typeof window === 'undefined' ? null : readUtmParams()), []);

  useEffect(() => {
    const syncOfflineLeads = async () => {
      if (typeof window === 'undefined' || !navigator.onLine) return;
      const pending = localStorage.getItem('pending_leads');
      if (!pending) return;

      try {
        const leads = JSON.parse(pending);
        if (!Array.isArray(leads) || leads.length === 0) return;

        console.log(`[Offline Sync] Syncing ${leads.length} pending leads...`);
        const remaining: typeof leads = [];
        for (const lead of leads) {
          try {
            const res = await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lead),
            });
            if (!res.ok) {
              console.warn(`[Offline Sync] Lead delivery returned ${res.status}, will retry later`);
              remaining.push(lead);
            }
          } catch (fetchErr) {
            console.warn('[Offline Sync] Network error syncing lead, will retry later:', fetchErr);
            remaining.push(lead);
          }
        }
        if (remaining.length > 0) {
          localStorage.setItem('pending_leads', JSON.stringify(remaining));
          trackEvent('lead_offline_sync_partial', { synced: leads.length - remaining.length, remaining: remaining.length });
        } else {
          localStorage.removeItem('pending_leads');
          trackEvent('lead_offline_sync_success', { count: leads.length });
        }
      } catch (err) {
        console.error('Failed to sync offline leads:', err);
        // Preserve corrupted lead data under a backup key so it can be
        // recovered manually, then remove the broken entry to stop
        // repeated parse errors on every page load.
        localStorage.setItem('pending_leads_backup', pending);
        localStorage.removeItem('pending_leads');
      }
    };

    window.addEventListener('online', syncOfflineLeads);
    syncOfflineLeads();

    return () => {
      window.removeEventListener('online', syncOfflineLeads);
    };
  }, []);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setValidationError('');
    
    const privateFiles = [...uploadedFiles];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        setValidationError(`File ${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      setUploadProgress(`Uploading ${file.name} (${i + 1}/${files.length})...`);
      
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
      try {
        // Fetch presigned upload URL from secure backend endpoint
        const urlResponse = await fetch('/api/storage/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName, contentType: file.type, size: file.size }),
        });

        if (!urlResponse.ok) {
          const errMsg = await urlResponse.text();
          throw new Error(`Failed to generate upload URL: ${errMsg}`);
        }

        const { uploadUrl, fileId } = await urlResponse.json();

        // Upload directly using authorized signed URL via PUT
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!response.ok) {
          const errMsg = await response.text();
          throw new Error(errMsg);
        }

        privateFiles.push({ fileId, name: file.name });
      } catch (err) {
        console.error('Failed to upload file via presigned URL:', err);
        setValidationError(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    setUploadedFiles(privateFiles);
    setUploading(false);
    setUploadProgress('');
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const updated = uploadedFiles.filter((_, idx) => idx !== indexToRemove);
    setUploadedFiles(updated);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return !!formData.market && !!formData.propertyType && !!formData.city.trim();
      case 1:
        return !!formData.projectType && !!formData.timeline && !!formData.budget && !!formData.notes.trim();
      case 2:
        return (
          !!formData.name.trim() &&
          !!formData.phone.trim() &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
          !!formData.contactMethod
        );
      default:
        return true;
    }
  };

  const getStepError = (step: number) => {
    switch (step) {
      case 0:
        if (!formData.market) return 'Please select a market segment.';
        if (!formData.propertyType) return 'Please select a property class.';
        if (!formData.city.trim()) return 'City is required.';
        return '';
      case 1:
        if (!formData.projectType) return 'Please select a project type.';
        if (!formData.timeline) return 'Please select a timeline.';
        if (!formData.budget) return 'Please select a budget range.';
        if (!formData.notes.trim()) return 'Scope notes are required to check details.';
        return '';
      case 2:
        if (!formData.name.trim()) return 'Full name is required.';
        if (!formData.phone.trim()) return 'Phone number is required.';
        if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
          return 'Please enter a valid email address.';
        }
        if (!formData.contactMethod) return 'Please select a contact method.';
        return '';
      default:
        return '';
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      if (currentStep === 0) {
        trackEvent('lead_form_start', { source, market: formData.market });
      }
      setDirection(1);
      setCurrentStep((prev) => Math.min(prev + 1, 2));
      setValidationError('');
    } else {
      setValidationError(getStepError(currentStep));
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setValidationError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep < 2) {
      e.preventDefault();
      handleNext();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isStepValid(2)) {
      setValidationError(getStepError(2));
      return;
    }

    const botHoneypot = formData.bot_honeypot;
    if (botHoneypot) {
      setStatus('sent');
      setMessage('Your estimate request was received. Sky’s the Limit can follow up by your preferred contact method, confirm scope, and walk through scheduling next steps.');
      return;
    }

    const referrerEmail = typeof window !== 'undefined' ? localStorage.getItem('referrer_email') : null;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = globalThis.crypto.randomUUID();
    }
    const payload = {
      idempotencyKey: idempotencyKeyRef.current,
      source,
      page: window.location.pathname,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      city: formData.city,
      projectAddress: formData.projectAddress,
      market: formData.market,
      projectType: formData.projectType,
      propertyType: formData.propertyType,
      timeline: formData.timeline,
      budget: formData.budget,
      contactMethod: formData.contactMethod,
      photosUrl: formData.photosUrl,
      photoFileIds: uploadedFiles.map((file) => file.fileId),
      notes: formData.notes,
      company: '',
      website: formData.website,
      hubspotutk: typeof document !== 'undefined' ? document.cookie.match(/hubspotutk=([^;]+)/)?.[1] : undefined,
      ...(referrerEmail ? { referrerEmail } : {}),
      ...utm,
    };

    if (payload.website) {
      setStatus('fallback');
      return;
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      const pendingLeads = JSON.parse(localStorage.getItem('pending_leads') || '[]');
      pendingLeads.push(payload);
      localStorage.setItem('pending_leads', JSON.stringify(pendingLeads));

      setStatus('fallback');
      setMessage('Offline Mode: Your estimate request was saved locally. It will sync automatically as soon as your internet connection is restored.');
      trackEvent('lead_form_submit_error', { source, market: payload.market, reason: 'offline' });
      return;
    }

    setStatus('submitting');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result?.ok === true) {
        setStatus('sent');
        setMessage('Your estimate request was received. Sky’s the Limit can follow up by your preferred contact method, confirm scope, and walk through scheduling next steps.');
        trackEvent('lead_form_submit_success', { source, market: payload.market });
        return;
      }

      if (response.status === 502 || response.status === 501 || result?.fallback === 'email') {
        setStatus('fallback');
        setMessage('Email delivery needs provider setup. Open the prepared email draft to send your request now.');
        trackEvent('lead_form_submit_error', { source, market: payload.market, reason: 'email_provider_missing' });
        trackEvent('lead_mailto_fallback_opened', { source, market: payload.market, reason: 'email_provider_missing' });
        window.location.href = buildEstimateMailto({
          Source: source,
          Name: payload.name,
          Phone: payload.phone,
          Email: payload.email,
          City: payload.city,
          'Project address': payload.projectAddress,
          Market: payload.market,
          'Project type': payload.projectType,
          'Property type': payload.propertyType,
          Timeline: payload.timeline,
          Budget: payload.budget,
          'Preferred contact': payload.contactMethod,
          'Photo link': payload.photosUrl,
          Notes: payload.notes,
        });
        return;
      }

      setStatus('error');
      setMessage(result?.error || 'The request could not be sent. Please call, text, or email Anthony directly.');
      trackEvent('lead_form_submit_error', { source, market: payload.market, status: response.status });
    } catch {
      setStatus('fallback');
      setMessage('The lead endpoint did not respond. Open the prepared email draft or call/text Anthony directly.');
      trackEvent('lead_form_submit_error', { source, reason: 'network' });
      trackEvent('lead_mailto_fallback_opened', { source, reason: 'network' });
      window.location.href = buildEstimateMailto({
        Source: source,
        Name: payload.name,
        Phone: payload.phone,
        Email: payload.email,
        City: payload.city,
        'Project address': payload.projectAddress,
        Market: payload.market,
        'Project type': payload.projectType,
        'Property type': payload.propertyType,
        Timeline: payload.timeline,
        Budget: payload.budget,
        'Preferred contact': payload.contactMethod,
        'Photo link': payload.photosUrl,
        Notes: payload.notes,
      });
    }
  };

  const stepTitles = [
    'Location & Segment',
    'Project Specifications',
    'Personal Verification',
  ];

  const progressPercent = Math.round(((currentStep + 1) / 3) * 100);

  if (status === 'sent') {
    return (
      <div className="border border-white/30 bg-[#0B0B0D]/50 p-8 text-center space-y-6 rounded-none">
        <h4 className="text-2xl font-black text-white">Inquiry Dispatched</h4>
        <p className="text-sm leading-relaxed text-gray-300 max-w-md mx-auto">{message}</p>
        <div className="pt-2">
          <button
            onClick={() => {
              setStatus('idle');
              setCurrentStep(0);
              setFormData({
                market: defaultMarket,
                projectType: '',
                propertyType: '',
                timeline: '',
                budget: '',
                name: '',
                city: '',
                phone: '',
                email: '',
                contactMethod: '',
                projectAddress: '',
                photosUrl: '',
                notes: '',
                bot_honeypot: '',
                website: '',
              });
            }}
            className="bg-white px-6 py-3 text-xs font-black text-[#050505] hover:bg-white transition-colors rounded-none cursor-pointer"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 40 : -40,
      opacity: prefersReducedMotion ? 1 : 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir < 0 ? 40 : -40,
      opacity: prefersReducedMotion ? 1 : 0,
    }),
  };

  const slideTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        x: { type: 'spring' as const, stiffness: 380, damping: 30 },
        opacity: { duration: 0.2 },
      };

  return (
    <form className="space-y-6 relative rounded-none" onSubmit={handleSubmit} onKeyDown={handleKeyDown} aria-busy={status === 'submitting'}>
      {/* Honeypots */}
      <input type="text" style={{ display: 'none' }} name="bot_honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" value={formData.bot_honeypot} onChange={(e) => updateField('bot_honeypot', e.target.value)} />
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={formData.website} onChange={(e) => updateField('website', e.target.value)} />

      {/* Modern Progress Line */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-white">
            Step {currentStep + 1} of 3 // {stepTitles[currentStep]}
          </span>
          <span className="text-xs font-bold text-gray-400">{progressPercent}%</span>
        </div>
        <div className="h-1 bg-white/10 w-full rounded-none">
          <div className="h-full bg-white transition-[width] duration-300 rounded-none" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* Dynamic Animated Core Panel */}
      <motion.div layout={!prefersReducedMotion} className="overflow-hidden bg-white/[0.02] border border-white/5 p-6 space-y-6 relative">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="space-y-6"
          >
            {/* STEP 0: LOCATION & SEGMENT */}
            {currentStep === 0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className={labelClass}>Market Segment</span>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {['Residential', 'Commercial', 'Public Sector'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField('market', option as any)}
                        className={`${selectButtonClass} ${
                          formData.market === option
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {/* Select for tests & accessibility */}
                  <select name="market" aria-label="Market" value={formData.market} onChange={(e) => updateField('market', e.target.value as any)} className="hidden">
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Public Sector">Public Sector</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className={labelClass}>Property Type</span>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {propertyOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField('propertyType', option)}
                        className={`${selectButtonClass} ${
                          formData.propertyType === option
                            ? 'border-white bg-white/10 text-white'
                            : 'border-white/10 bg-white/5 text-white hover:border-white/30'
                        }`}
                      >
                        {option.split(' / ')[0]}
                      </button>
                    ))}
                  </div>
                  <select name="propertyType" aria-label="Property type" value={formData.propertyType} onChange={(e) => updateField('propertyType', e.target.value)} className="hidden">
                    <option value="">Select Class</option>
                    {propertyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="city-input" className={labelClass}>Which city is the property in?</label>
                  <input
                    id="city-input"
                    name="city"
                    type="text"
                    required
                    placeholder="e.g. Minneapolis"
                    aria-label="City"
                    autoComplete="address-level2"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            )}

            {/* STEP 1: PROJECT SPECIFICATIONS */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <span className={labelClass}>Project Type</span>
                    <select
                      name="projectType"
                      aria-label="Project type"
                      value={formData.projectType}
                      onChange={(e) => updateField('projectType', e.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Select Type</option>
                      {projectOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <span className={labelClass}>Timeline</span>
                    <select
                      name="timeline"
                      aria-label="Timeline"
                      value={formData.timeline}
                      onChange={(e) => updateField('timeline', e.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Select Timeline</option>
                      {timelineOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <span className={labelClass}>Budget range</span>
                    <select
                      name="budget"
                      aria-label="Budget range"
                      value={formData.budget}
                      onChange={(e) => updateField('budget', e.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Select Budget</option>
                      {budgetOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="notes-input" className={labelClass}>Project details</label>
                  <textarea
                    id="notes-input"
                    name="notes"
                    rows={3}
                    required
                    placeholder="Describe rooms, siding style, trim, cabinets, or any specific prep concerns..."
                    aria-label="Project details"
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className={`${fieldClass} resize-none`}
                  />
                </div>

                <div className="space-y-2">
                  <span className={labelClass}>Photo Documentation (Optional)</span>
                  <div className="border border-dashed border-white/10 bg-white/5 p-4 text-center hover:border-white transition-colors relative cursor-pointer group rounded-none">
                    <input
                      id="file-uploader"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Upload size={24} className="text-gray-400 group-hover:text-white transition-colors" />
                      <p className="text-xs font-bold text-white">Drag photos here or tap to select</p>
                      <p className="text-xs text-gray-400">Max size 10MB per image</p>
                    </div>
                  </div>

                  {uploading && (
                    <div className="flex items-center justify-center gap-2 p-2 bg-white/10 border border-white/20 text-xs font-bold text-white">
                      <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                      {uploadProgress}
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="grid grid-cols-4 gap-2.5 pt-1">
                      {uploadedFiles.map((file, idx) => (
                        <div key={file.fileId} className="relative min-h-20 border border-white/10 bg-white/5 overflow-hidden rounded-none p-2 flex items-center">
                          <span className="text-[10px] text-white/70 break-all">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-black border border-white/15 text-white p-0.5 rounded-none hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <label htmlFor="photos-input" className="block text-xs font-semibold text-[#c9c1b4] mb-1.5">
                      Or paste a cloud link (Google Drive, Dropbox, etc.)
                    </label>
                    <input
                      id="photos-input"
                      name="photosUrl"
                      type="text"
                      placeholder="https://drive.google.com/..."
                      aria-label="Project photo link"
                      value={formData.photosUrl}
                      onChange={(e) => updateField('photosUrl', e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PERSONAL VERIFICATION */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="name-input" className={labelClass}>Full name</label>
                    <input
                      id="name-input"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. Johnny Cage"
                      aria-label="Full name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone-input" className={labelClass}>Phone</label>
                    <input
                      id="phone-input"
                      name="phone"
                      type="tel"
                      required
                      placeholder="e.g. 651-410-4196"
                      aria-label="Phone"
                      autoComplete="tel"
                      inputMode="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="email-input" className={labelClass}>Email</label>
                    <input
                      id="email-input"
                      name="email"
                      type="email"
                      required
                      placeholder="e.g. johnny@fight.com"
                      aria-label="Email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className={labelClass}>Preferred contact method</span>
                    <select
                      name="contactMethod"
                      aria-label="Preferred contact method"
                      value={formData.contactMethod}
                      onChange={(e) => updateField('contactMethod', e.target.value)}
                      className={fieldClass}
                    >
                      <option value="">Select Method</option>
                      {contactMethods.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor="address-input" className={labelClass}>Project address or cross streets</label>
                    <span className="text-xs text-gray-400 font-bold">Optional</span>
                  </div>
                  <input
                    id="address-input"
                    name="projectAddress"
                    type="text"
                    placeholder="e.g. 100 Main St, Inver Grove Heights"
                    aria-label="Project address or cross streets"
                    autoComplete="street-address"
                    value={formData.projectAddress}
                    onChange={(e) => updateField('projectAddress', e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Validation Feedback */}
      {validationError && (
        <p className="text-xs font-bold text-white border-l-2 border-white pl-3" role="alert">
          {validationError}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {currentStep > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center border border-white/10 hover:border-white/30 bg-white/5 px-5 py-4 text-sm font-black text-white transition-colors cursor-pointer rounded-none"
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </button>
        )}

        {currentStep < 2 ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 inline-flex items-center justify-center bg-white hover:bg-white text-[#050505] px-5 py-4 text-sm font-semibold transition-colors cursor-pointer rounded-none"
          >
            Next Section <ArrowRight size={16} className="ml-2" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="flex-1 inline-flex items-center justify-center bg-white hover:bg-white text-[#050505] px-6 py-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer rounded-none"
          >
            {status === 'submitting' ? 'Sending...' : 'Request My Free Estimate'} <ArrowRight size={18} className="ml-2" />
          </button>
        )}
      </div>

      {/* Trust Badge Footer */}
      <p className="flex items-start gap-2 text-xs font-semibold text-gray-400 leading-relaxed" aria-live="polite">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-white" />
        {message || 'We respect your time and inbox. You\u2019ll only hear from us regarding your painting project.'}
      </p>
    </form>
  );
}
