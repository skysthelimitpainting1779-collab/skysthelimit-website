'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Loader2, User } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import RangeSlider from '../components/RangeSlider';
import { trackEvent } from '../lib/analytics';
import { buildEstimateMailto } from '../lib/contact';
import {
  buildEstimateLeadFields,
  calculateEstimate,
  formatEstimateRange,
  selectEstimateIdempotency,
  type EstimateIdempotencyState,
  type EstimateInput,
  type EstimateProjectType,
  type EstimateRange,
  type ExteriorSiding,
  type ExteriorStories,
  type PrepLevel,
} from '../lib/estimate';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

type ProjectType = EstimateProjectType | null;

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: React.ReactNode;
  isComponent?: boolean;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 24,
};

export default function EstimatePage() {
  const idempotencyRef = useRef<EstimateIdempotencyState | null>(null);
  const initializedRef = useRef(false);
  const messageIdRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const prefersReducedMotion = useReducedMotion();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [roomType, setRoomType] = useState('Bedroom');
  const [width, setWidth] = useState(12);
  const [length, setLength] = useState(14);
  const [height, setHeight] = useState(8);
  const [stories, setStories] = useState<ExteriorStories>('1 Story');
  const [siding, setSiding] =
    useState<ExteriorSiding>('Wood / LP SmartSide');
  const [cabinetCount, setCabinetCount] = useState(20);
  const [prepLevel, setPrepLevel] = useState<PrepLevel | null>(null);
  const [estimateInput, setEstimateInput] = useState<EstimateInput | null>(
    null,
  );
  const [estimateRange, setEstimateRange] = useState<EstimateRange | null>(
    null,
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'fallback' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const nextMessageId = () => {
    messageIdRef.current += 1;
    return `estimate-message-${messageIdRef.current}`;
  };

  const schedule = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, prefersReducedMotion ? 0 : delay);
    timersRef.current.add(timer);
    return timer;
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, step]);

  const addBotMessage = (text: React.ReactNode, delay = 600, isComponent = false) => {
    setIsTyping(true);
    schedule(() => {
      setIsTyping(false);
      setMessages((previous) => [
        ...previous,
        { id: nextMessageId(), sender: 'bot', text, isComponent },
      ]);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages((previous) => [
      ...previous,
      { id: nextMessageId(), sender: 'user', text },
    ]);
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    addBotMessage(
      "Let's build a rough planning range for your painting project. It takes about a minute.",
      300,
    );
    schedule(() => setStep(1), 800);
  }, [prefersReducedMotion]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current) clearTimeout(timer);
      timersRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (isTyping) return;
    const frame = requestAnimationFrame(() => {
      controlsRef.current
        ?.querySelector<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href]',
        )
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isTyping, step]);

  const handleProjectType = (type: EstimateProjectType, label: string) => {
    addUserMessage(label);
    setProjectType(type);
    trackEvent('estimate_started', { projectType: type });
    
    if (type === 'interior') {
      addBotMessage("Great. Interior painting it is. What kind of room are we looking at?");
      setStep(2);
    } else if (type === 'exterior') {
      addBotMessage("Exterior painting. How many stories is the home?");
      setStep(3);
    } else if (type === 'cabinets') {
      addBotMessage("Cabinet refinishing makes a huge impact. Roughly how many doors and drawers are there total?");
      setStep(4);
    }
  };

  const handleInteriorRoom = (type: string) => {
    addUserMessage(type);
    setRoomType(type);
    addBotMessage("Got it. Adjust the rough dimensions below so I can calculate the surface area.");
    setStep(2.1);
  };

  const submitInteriorDimensions = () => {
    addUserMessage(`${width}x${length}x${height} ft`);
    addBotMessage("What level of prep and finish are you looking for?");
    setStep(5);
  };

  const handleExteriorStories = (val: ExteriorStories) => {
    addUserMessage(val);
    setStories(val);
    addBotMessage("What type of siding do you have?");
    setStep(3.1);
  };

  const handleExteriorSiding = (val: ExteriorSiding) => {
    addUserMessage(val);
    setSiding(val);
    addBotMessage("What level of prep and finish are you looking for?");
    setStep(5);
  };

  const submitCabinets = () => {
    addUserMessage(`${cabinetCount} doors/drawers`);
    addBotMessage("What level of prep and finish are you looking for?");
    setStep(5);
  };

  const buildCurrentInput = (prep: PrepLevel): EstimateInput | null => {
    if (projectType === 'interior') {
      return {
        height,
        length,
        prepLevel: prep,
        projectType,
        roomType,
        width,
      };
    }
    if (projectType === 'exterior') {
      return {
        prepLevel: prep,
        projectType,
        siding,
        stories,
      };
    }
    if (projectType === 'cabinets') {
      return {
        cabinetCount,
        prepLevel: prep,
        projectType,
      };
    }
    return null;
  };

  const revealEstimate = (range: EstimateRange) => {
    const formattedRange = formatEstimateRange(range);
    addBotMessage(
      <div className="space-y-4">
        <p className="text-sm font-medium text-[var(--foreground)]">
          Your rough planning range
        </p>
        <div className="relative overflow-hidden border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
          <div className="absolute inset-y-0 left-0 w-1 bg-[var(--primary)]" />
          <p className="eyebrow mb-2">Estimated range</p>
          <p className="tnum text-3xl font-black text-[var(--foreground)] sm:text-4xl">
            {formattedRange}
          </p>
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          This is a planning range, not a quote. Anthony will confirm surfaces,
          preparation, and access during a no-pressure walkthrough.
        </p>
      </div>,
      0,
      true,
    );
    setStep(7);
  };

  const handlePrep = (prep: PrepLevel, label: string) => {
    const input = buildCurrentInput(prep);
    if (!input) {
      setStatus('error');
      setSubmitMessage('Choose a project type before calculating a range.');
      return;
    }
    const range = calculateEstimate(input);
    addUserMessage(label);
    setPrepLevel(prep);
    setEstimateInput(input);
    setEstimateRange(range);
    trackEvent('estimate_calculated', {
      high: range.high,
      low: range.low,
      modelVersion: range.modelVersion,
      prepLevel: prep,
      projectType: input.projectType,
    });
    addBotMessage('Calculating your planning range...', 150);
    schedule(() => revealEstimate(range), 650);
    setStep(6);
  };

  const handleFinalSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!estimateInput || !estimateRange) {
      setStatus('error');
      setSubmitMessage(
        'Your planning range expired. Recalculate it before submitting.',
      );
      return;
    }
    const estimateFields = buildEstimateLeadFields(
      estimateInput,
      estimateRange,
    );
    const submission = {
      source: 'Chatbot Estimate',
      page: '/estimate',
      name,
      phone,
      email,
      city,
      projectType,
      prepLevel,
      market: 'Residential',
      timeline: 'Estimate requested',
      contactMethod: 'Phone',
      ...estimateFields,
    };
    const fingerprint = JSON.stringify(submission);
    const idempotency = selectEstimateIdempotency(
      idempotencyRef.current,
      fingerprint,
      () => globalThis.crypto.randomUUID(),
    );
    idempotencyRef.current = idempotency;
    const payload = {
      idempotencyKey: idempotency.key,
      ...submission,
    };

    setStatus('submitting');
    setSubmitMessage('Saving your request securely...');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotency.key,
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setStatus('sent');
        setSubmitMessage('');
        trackEvent('estimate_submitted', {
          modelVersion: estimateRange.modelVersion,
          projectType: estimateInput.projectType,
        });
        addUserMessage('Requested a walkthrough.');
        addBotMessage(
          "Thanks. We've saved your request and will follow up within one business day.",
          400,
        );
      } else {
        setStatus('fallback');
        setSubmitMessage(
          'We could not confirm the request. Retry with the same details or email us directly.',
        );
      }
    } catch {
      setStatus('fallback');
      setSubmitMessage(
        'Your connection dropped before confirmation. Retry or email us directly.',
      );
    }
  };

  const fallbackHref =
    estimateInput && estimateRange
      ? buildEstimateMailto({
          Budget: formatEstimateRange(estimateRange),
          City: city,
          Email: email,
          Name: name,
          Notes: buildEstimateLeadFields(estimateInput, estimateRange).notes,
          Phone: phone,
        })
      : buildEstimateMailto({});

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: springConfig }
  };
  const phase =
    status === 'sent'
      ? 6
      : step <= 1
        ? 1
        : step < 5
          ? 2
          : step === 5
            ? 3
            : step === 6
              ? 4
              : 5;
  const phaseLabels = [
    'Project',
    'Scope',
    'Preparation',
    'Range',
    'Contact',
    'Complete',
  ];

  return (
    <MotionConfig reducedMotion="user">
      <PageTransition>
        <section
          data-estimate-planner
          aria-labelledby="estimate-title"
          className="dark relative flex min-h-[calc(100svh-116px)] items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8"
        >
          <div className="relative flex w-full max-w-2xl flex-col gap-2">
            <div className="relative flex h-[min(780px,calc(100svh-148px))] min-h-[560px] w-full flex-col overflow-hidden border border-[var(--border)] bg-[var(--background)] shadow-2xl">
              <header className="z-10 shrink-0 border-b border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center bg-white">
                    <img
                      src="/brand/SkyLLP_BrandLogo.svg"
                      alt=""
                      className="size-6"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1
                      id="estimate-title"
                      className="text-lg font-bold text-[var(--foreground)]"
                    >
                      Project planner
                    </h1>
                    <p className="mt-1 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                      Step {phase} of 6: {phaseLabels[phase - 1]}
                    </p>
                  </div>
                </div>
                <div
                  role="progressbar"
                  aria-label="Estimate progress"
                  aria-valuemin={1}
                  aria-valuemax={6}
                  aria-valuenow={phase}
                  className="mt-4 h-1 overflow-hidden bg-[var(--muted)]"
                >
                  <div
                    className="h-full bg-[var(--primary)] transition-[width] motion-reduce:transition-none"
                    style={{ width: `${(phase / 6) * 100}%` }}
                  />
                </div>
              </header>

              <div
                ref={scrollRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                className={cn(
                  'flex-1 space-y-8 overflow-y-auto p-4 motion-reduce:scroll-auto sm:p-8',
                  step === 7 ? 'pb-[24rem] sm:pb-[21rem]' : 'pb-32',
                )}
              >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={springConfig}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    <div
                      aria-hidden="true"
                      className={`flex size-10 shrink-0 items-center justify-center ${msg.sender === 'user' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]'}`}
                    >
                      {msg.sender === 'user' ? <User size={18} strokeWidth={1.5} /> : <Bot size={18} strokeWidth={1.5} />}
                    </div>

                    <div className={cn(
                      "p-5 text-sm leading-relaxed",
                      msg.sender === 'user' 
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : msg.isComponent 
                          ? "bg-transparent p-0 w-full"
                          : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)]"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-4">
                    <div
                      aria-hidden="true"
                      className="flex size-10 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)]"
                    >
                      <Bot size={18} strokeWidth={1.5} />
                    </div>
                    <div
                      aria-label="Calculating"
                      className="flex h-[60px] items-center gap-2 border border-[var(--border)] bg-[var(--card)] p-5"
                    >
                      <div className="size-1.5 animate-bounce bg-[var(--muted-foreground)] [animation-delay:-0.3s] motion-reduce:animate-none" />
                      <div className="size-1.5 animate-bounce bg-[var(--muted-foreground)] [animation-delay:-0.15s] motion-reduce:animate-none" />
                      <div className="size-1.5 animate-bounce bg-[var(--muted-foreground)] motion-reduce:animate-none" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

              <div ref={controlsRef} className="absolute inset-x-0 bottom-0 z-20 max-h-[58%] overflow-y-auto border-t border-[var(--border)] bg-[var(--background)] px-4 py-5 sm:px-8">
             <AnimatePresence mode="wait">
               {step === 1 && !isTyping && (
                 <motion.div role="group" aria-label="Project type" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="flex flex-col gap-3 sm:flex-row">
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProjectType('interior', 'Interior Rooms')} className="flex-1 border border-[var(--border)] bg-[var(--secondary)] p-4 text-sm font-bold text-[var(--foreground)] shadow-lg transition-colors hover:bg-[var(--muted)]">Interior Rooms</motion.button>
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProjectType('exterior', 'Exterior Painting')} className="flex-1 border border-[var(--border)] bg-[var(--secondary)] p-4 text-sm font-bold text-[var(--foreground)] shadow-lg transition-colors hover:bg-[var(--muted)]">Exterior Painting</motion.button>
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProjectType('cabinets', 'Cabinet Refinishing')} className="flex-1 border border-[var(--border)] bg-[var(--secondary)] p-4 text-sm font-bold text-[var(--foreground)] shadow-lg transition-colors hover:bg-[var(--muted)]">Cabinet Refinishing</motion.button>
                 </motion.div>
               )}

               {step === 2 && !isTyping && (
                 <motion.div role="group" aria-label="Room type" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="grid grid-cols-2 gap-3">
                   {['Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Hallway', 'Other'].map(r => (
                     <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={r} onClick={() => handleInteriorRoom(r)} className="border border-[var(--border)] bg-[var(--secondary)] p-4 text-sm font-bold text-[var(--foreground)] shadow-lg transition-colors hover:bg-[var(--muted)]">{r}</motion.button>
                   ))}
                 </motion.div>
               )}

               {step === 2.1 && !isTyping && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springConfig} className="space-y-6 border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
                    <RangeSlider id="w" label="Width" value={width} min={5} max={40} suffix="FT" onChange={setWidth} />
                    <RangeSlider id="l" label="Length" value={length} min={5} max={40} suffix="FT" onChange={setLength} />
                    <RangeSlider id="h" label="Ceiling Height" value={height} min={7} max={20} suffix="FT" onChange={setHeight} />
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={submitInteriorDimensions} className="mt-4 w-full bg-[var(--primary)] p-4 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]">Confirm dimensions</motion.button>
                 </motion.div>
               )}

               {step === 3 && !isTyping && (
                 <motion.div role="group" aria-label="Home stories" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="flex flex-col gap-3">
                   {(['1 Story', '2 Story', '3+ Story'] as const).map(s => (
                     <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={s} onClick={() => handleExteriorStories(s)} className="border border-[var(--border)] bg-[var(--secondary)] p-4 text-left text-sm font-bold text-[var(--foreground)] shadow-lg transition-colors hover:bg-[var(--muted)]">{s}</motion.button>
                   ))}
                 </motion.div>
               )}

               {step === 3.1 && !isTyping && (
                 <motion.div role="group" aria-label="Siding type" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="grid grid-cols-2 gap-3">
                   {(['Wood / LP SmartSide', 'Stucco', 'Vinyl / Aluminum', 'Brick / Masonry'] as const).map(s => (
                     <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={s} onClick={() => handleExteriorSiding(s)} className="flex h-full items-center justify-center border border-[var(--border)] bg-[var(--secondary)] p-4 text-center text-sm font-bold text-[var(--foreground)] shadow-lg transition-colors hover:bg-[var(--muted)]">{s}</motion.button>
                   ))}
                 </motion.div>
               )}

               {step === 4 && !isTyping && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springConfig} className="space-y-6 border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl">
                    <RangeSlider id="c" label="Total Doors & Drawers" value={cabinetCount} min={5} max={60} onChange={setCabinetCount} />
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={submitCabinets} className="mt-4 w-full bg-[var(--primary)] p-4 text-sm font-bold text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary-hover)]">Confirm count</motion.button>
                 </motion.div>
               )}

               {step === 5 && !isTyping && (
                 <motion.div role="group" aria-label="Preparation level" variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="flex flex-col gap-3">
                   <motion.button aria-label="Standard prep" variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => handlePrep('standard', 'Standard Prep')} className="border border-[var(--border)] bg-[var(--secondary)] p-5 text-left shadow-lg transition-colors hover:bg-[var(--muted)]">
                     <p className="text-sm font-bold text-[var(--foreground)]">Standard prep</p>
                     <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">Light patching, minor caulk, one primer coat, and one topcoat. Best for minor refreshes.</p>
                   </motion.button>
                   <motion.button aria-label="Premium detail prep" variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => handlePrep('premium', 'Premium Detail Prep')} className="border border-[var(--primary)] bg-[var(--secondary)] p-5 text-left shadow-lg transition-colors hover:bg-[var(--muted)]">
                     <p className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">Premium detail prep <span className="bg-[var(--primary)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--primary-foreground)]">Recommended</span></p>
                     <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">Multi-stage sanding, deep caulking, wood stabilization, and premium coats.</p>
                   </motion.button>
                 </motion.div>
               )}

               {step === 7 && !isTyping && status !== 'sent' && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springConfig} className="relative overflow-hidden border border-[var(--primary)] bg-[var(--card)] p-6 shadow-2xl">
                   <div className="absolute inset-x-0 top-0 h-1 bg-[var(--primary)]" />
                   <form onSubmit={handleFinalSubmit} className="space-y-4">
                     <fieldset className="space-y-4">
                       <legend className="eyebrow mb-4">Request a walkthrough</legend>
                       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                         <div className="space-y-1.5">
                           <label htmlFor="estimate-name" className="text-xs font-semibold text-[var(--foreground)]">Name</label>
                           <Input id="estimate-name" required type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="h-11 bg-[var(--background)]" />
                         </div>
                         <div className="space-y-1.5">
                           <label htmlFor="estimate-phone" className="text-xs font-semibold text-[var(--foreground)]">Phone</label>
                           <Input id="estimate-phone" required type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} className="h-11 bg-[var(--background)]" />
                         </div>
                       </div>
                       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                         <div className="space-y-1.5">
                           <label htmlFor="estimate-email" className="text-xs font-semibold text-[var(--foreground)]">Email</label>
                           <Input id="estimate-email" required type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11 bg-[var(--background)]" />
                         </div>
                         <div className="space-y-1.5">
                           <label htmlFor="estimate-city" className="text-xs font-semibold text-[var(--foreground)]">Project city</label>
                           <Input id="estimate-city" required type="text" autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} className="h-11 bg-[var(--background)]" />
                         </div>
                       </div>
                     </fieldset>
                     <Button disabled={status === 'submitting'} type="submit" size="lg" className="h-11 w-full">
                       {status === 'submitting' ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
                       {status === 'submitting' ? 'Saving request' : 'Request walkthrough'}
                     </Button>
                     <div aria-live="polite" className="min-h-5 text-xs text-[var(--muted-foreground)]">
                       {submitMessage}
                     </div>
                     {status === 'fallback' ? (
                       <a href={fallbackHref} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary)] underline underline-offset-4">
                         Email this request instead
                       </a>
                     ) : null}
                   </form>
                 </motion.div>
               )}
             </AnimatePresence>
              </div>
            </div>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              MN reg: ir816596 | painting contractor
            </p>
          </div>
        </section>
      </PageTransition>
    </MotionConfig>
  );
}
