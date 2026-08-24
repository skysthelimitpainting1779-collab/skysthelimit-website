'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import { Calculator, ArrowRight, ShieldCheck, CheckCircle2, User, Bot, Loader2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import RangeSlider from '../components/RangeSlider';
import { trackEvent } from '../lib/analytics';
import { buildEstimateMailto } from '../lib/contact';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

type ProjectType = 'interior' | 'exterior' | 'cabinets' | null;
type PrepLevel = 'standard' | 'premium' | null;

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: React.ReactNode;
  isComponent?: boolean;
}

const springConfig: any = { type: "spring", stiffness: 300, damping: 24 };

export default function EstimatePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // State
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectType>(null);
  
  // Interior State
  const [roomType, setRoomType] = useState('Bedroom');
  const [width, setWidth] = useState(12);
  const [length, setLength] = useState(14);
  const [height, setHeight] = useState(8);

  // Exterior State
  const [stories, setStories] = useState('1 Story');
  const [siding, setSiding] = useState('Wood / LP SmartSide');

  // Cabinet State
  const [cabinetCount, setCabinetCount] = useState(20);

  // Common State
  const [prepLevel, setPrepLevel] = useState<PrepLevel>(null);

  // Lead State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'fallback' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, step]);

  const addBotMessage = (text: React.ReactNode, delay = 600, isComponent = false) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'bot', text, isComponent }]);
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'user', text }]);
  };

  // Initialize
  useEffect(() => {
    if (step === 0) {
      addBotMessage("Hi there! I'm the Sky's the Limit pricing assistant. I can help you build a rough price range for your painting project in under a minute.", 400);
      setTimeout(() => setStep(1), 1200);
    }
  }, []);

  const handleProjectType = (type: ProjectType, label: string) => {
    addUserMessage(label);
    setProjectType(type);
    
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

  const handleExteriorStories = (val: string) => {
    addUserMessage(val);
    setStories(val);
    addBotMessage("What type of siding do you have?");
    setStep(3.1);
  };

  const handleExteriorSiding = (val: string) => {
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

  const handlePrep = (prep: PrepLevel, label: string) => {
    addUserMessage(label);
    setPrepLevel(prep);
    addBotMessage("Calculating your estimate...", 400);
    setTimeout(() => {
      calculateFinal();
    }, 1500);
    setStep(6);
  };

  const calculateFinal = () => {
    let low = 0;
    let high = 0;

    if (projectType === 'interior') {
      const wallArea = 2 * (width + length) * height;
      const base = wallArea * 3.50;
      const prepVal = prepLevel === 'premium' ? base * 0.35 : 0;
      const total = base + prepVal + 250;
      low = total * 0.90;
      high = total * 1.15;
    } else if (projectType === 'exterior') {
      let base = 3500;
      if (stories === '2 Story') base = 5500;
      if (stories === '3+ Story') base = 8500;
      
      let mult = 1.0;
      if (siding === 'Stucco') mult = 1.3;
      if (siding === 'Brick / Masonry') mult = 1.4;

      const total = base * mult * (prepLevel === 'premium' ? 1.3 : 1.0);
      low = total * 0.85;
      high = total * 1.20;
    } else if (projectType === 'cabinets') {
      const total = cabinetCount * (prepLevel === 'premium' ? 150 : 115);
      low = total * 0.90;
      high = total * 1.15;
    }

    low = Math.round(low / 100) * 100;
    high = Math.round(high / 100) * 100;

    addBotMessage(
      <div className="space-y-4 reveal-up">
        <p className="text-sm font-medium">Based on your selections, here is your rough planning range:</p>
        <div className="bg-[#11100d] border border-white/10 p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5A00]/5 to-transparent pointer-events-none"></div>
          <p className="eyebrow mb-2">Estimated Range</p>
          <p className="text-4xl font-black text-white tnum">${low.toLocaleString()} - ${high.toLocaleString()}</p>
        </div>
        <p className="text-sm">If this fits your budget, fill out the form below and Anthony will reach out within one business day to schedule a firm, on-site walkthrough. No obligation, no pressure.</p>
      </div>
    , 200, true);

    setStep(7);
  };

  const handleFinalSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      source: 'Chatbot Estimate',
      page: '/estimate',
      name, phone, email, city,
      projectType, prepLevel,
      notes: `Project: ${projectType} \nPrep: ${prepLevel}`
    };

    setStatus('submitting');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setStatus('sent');
        addUserMessage("Submitted my info.");
        addBotMessage("Thanks! We've received your request and will be in touch shortly to schedule a walkthrough.", 600);
      } else {
        setStatus('fallback');
      }
    } catch {
      setStatus('fallback');
    }
  };

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

  return (
    <PageTransition>
      <section className="relative min-h-[calc(100svh-116px)] flex items-center justify-center bg-[#050505] py-12 px-4 sm:px-6 lg:px-8 overflow-hidden mesh-gradient-bg">
        
        <div className="relative w-full max-w-2xl flex flex-col h-[85svh] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden perspective-1000">
          
          {/* Header */}
          <div className="flex items-center gap-4 bg-[#070706]/90 backdrop-blur-md p-5 border-b border-white/10 z-10 shrink-0">
            <div className="h-10 w-10 bg-white flex items-center justify-center shrink-0">
               <img src="/brand/SkyLLP_BrandLogo.svg" alt="Sky" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight uppercase">Guided Project Estimator</h1>
              <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
                <span className="h-1.5 w-1.5 bg-[#FF5A00]"></span> Takes about one minute
              </p>
            </div>
          </div>

          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 scroll-smooth pb-32"
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
                    
                    <div className={`shrink-0 w-10 h-10 flex items-center justify-center ${msg.sender === 'user' ? 'bg-[#FF5A00]/20 text-[#FF5A00]' : 'bg-[#182023] text-white border border-white/10'}`}>
                      {msg.sender === 'user' ? <User size={18} strokeWidth={1.5} /> : <Bot size={18} strokeWidth={1.5} />}
                    </div>

                    <div className={cn(
                      "p-5 text-sm leading-relaxed",
                      msg.sender === 'user' 
                        ? "bg-[#FF5A00] text-white" 
                        : msg.isComponent 
                          ? "bg-transparent p-0 w-full"
                          : "bg-[#11100d] border border-white/10 text-[#c9c1b4]"
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
                    <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-[#182023] text-white border border-white/10">
                      <Bot size={18} strokeWidth={1.5} />
                    </div>
                    <div className="bg-[#11100d] border border-white/10 p-5 flex items-center gap-2 h-[60px]">
                      <div className="w-1.5 h-1.5 bg-white/40 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 animate-bounce"></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Footer */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-12 pb-6 px-4 sm:px-8 border-t border-white/5 z-20">
             <AnimatePresence mode="wait">
               {step === 1 && !isTyping && (
                 <motion.div variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="flex flex-col sm:flex-row gap-3">
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProjectType('interior', 'Interior Rooms')} className="flex-1 bg-[#182023] hover:bg-white/10 border border-white/10 p-4 text-sm font-bold transition-colors shadow-lg">Interior Rooms</motion.button>
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProjectType('exterior', 'Exterior Painting')} className="flex-1 bg-[#182023] hover:bg-white/10 border border-white/10 p-4 text-sm font-bold transition-colors shadow-lg">Exterior Painting</motion.button>
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleProjectType('cabinets', 'Cabinet Refinishing')} className="flex-1 bg-[#182023] hover:bg-white/10 border border-white/10 p-4 text-sm font-bold transition-colors shadow-lg">Cabinet Refinishing</motion.button>
                 </motion.div>
               )}

               {step === 2 && !isTyping && (
                 <motion.div variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="grid grid-cols-2 gap-3">
                   {['Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Hallway', 'Other'].map(r => (
                     <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={r} onClick={() => handleInteriorRoom(r)} className="bg-[#182023] hover:bg-white/10 border border-white/10 p-4 text-sm font-bold transition-colors shadow-lg">{r}</motion.button>
                   ))}
                 </motion.div>
               )}

               {step === 2.1 && !isTyping && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springConfig} className="bg-[#11100d] border border-white/10 p-6 space-y-6 shadow-2xl">
                    <RangeSlider id="w" label="Width" value={width} min={5} max={40} suffix="FT" onChange={setWidth} />
                    <RangeSlider id="l" label="Length" value={length} min={5} max={40} suffix="FT" onChange={setLength} />
                    <RangeSlider id="h" label="Ceiling Height" value={height} min={7} max={20} suffix="FT" onChange={setHeight} />
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={submitInteriorDimensions} className="w-full bg-white text-black p-4 text-sm font-bold hover:bg-gray-200 transition-colors mt-4">Confirm Dimensions</motion.button>
                 </motion.div>
               )}

               {step === 3 && !isTyping && (
                 <motion.div variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="flex flex-col gap-3">
                   {['1 Story', '2 Story', '3+ Story'].map(s => (
                     <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={s} onClick={() => handleExteriorStories(s)} className="bg-[#182023] hover:bg-white/10 border border-white/10 p-4 text-sm font-bold transition-colors shadow-lg text-left">{s}</motion.button>
                   ))}
                 </motion.div>
               )}

               {step === 3.1 && !isTyping && (
                 <motion.div variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="grid grid-cols-2 gap-3">
                   {['Wood / LP SmartSide', 'Stucco', 'Vinyl / Aluminum', 'Brick / Masonry'].map(s => (
                     <motion.button variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={s} onClick={() => handleExteriorSiding(s)} className="bg-[#182023] hover:bg-white/10 border border-white/10 p-4 text-sm font-bold transition-colors shadow-lg text-center flex items-center justify-center h-full">{s}</motion.button>
                   ))}
                 </motion.div>
               )}

               {step === 4 && !isTyping && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springConfig} className="bg-[#11100d] border border-white/10 p-6 space-y-6 shadow-2xl">
                    <RangeSlider id="c" label="Total Doors & Drawers" value={cabinetCount} min={5} max={60} onChange={setCabinetCount} />
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={submitCabinets} className="w-full bg-white text-black p-4 text-sm font-bold hover:bg-gray-200 transition-colors mt-4">Confirm Count</motion.button>
                 </motion.div>
               )}

               {step === 5 && !isTyping && (
                 <motion.div variants={containerVariants} initial="hidden" animate="show" exit="hidden" className="flex flex-col gap-3">
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => handlePrep('standard', 'Standard Prep')} className="text-left bg-[#182023] hover:bg-white/10 border border-white/10 p-5 transition-colors shadow-lg">
                     <p className="font-bold text-sm text-white">Standard Prep</p>
                     <p className="text-xs text-[#9ca3af] mt-2 leading-relaxed">Spot repairs, minor caulk where specified, and the agreed coating system. Best for straightforward refreshes.</p>
                   </motion.button>
                   <motion.button variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => handlePrep('premium', 'Premium Detail Prep')} className="text-left bg-[#182023] hover:bg-white/10 border border-white/10 p-5 transition-colors shadow-lg">
                     <p className="font-bold text-sm text-[#FF5A00] flex items-center gap-2">Premium Detail Prep <span className="bg-[#FF5A00]/20 text-[#FF5A00] text-[10px] uppercase px-2 py-0.5 tracking-wider font-bold">Recommended</span></p>
                     <p className="text-xs text-[#9ca3af] mt-2 leading-relaxed">Expanded sanding, caulking, and stabilization where the inspected surface requires more correction.</p>
                   </motion.button>
                 </motion.div>
               )}

               {step === 7 && !isTyping && status !== 'sent' && (
                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springConfig} className="bg-[#11100d] border border-[#FF5A00]/30 p-6 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF5A00]"></div>
                   <form onSubmit={handleFinalSubmit} className="space-y-4">
                     <h2 className="mb-4 text-xl font-black uppercase text-white">Request a walkthrough</h2>
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                       <label htmlFor="estimate-name" className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#c9c1b4]">
                         Name
                         <input id="estimate-name" name="name" autoComplete="name" required type="text" value={name} onChange={e => setName(e.target.value)} className="bg-[#050505] border border-white/10 p-3 text-base focus:border-[#FF5A00] outline-none transition-colors text-white" />
                       </label>
                       <label htmlFor="estimate-phone" className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#c9c1b4]">
                         Phone
                         <input id="estimate-phone" name="phone" autoComplete="tel" inputMode="tel" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="bg-[#050505] border border-white/10 p-3 text-base focus:border-[#FF5A00] outline-none transition-colors text-white" />
                       </label>
                     </div>
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                       <label htmlFor="estimate-email" className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#c9c1b4]">
                         Email
                         <input id="estimate-email" name="email" autoComplete="email" required type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-[#050505] border border-white/10 p-3 text-base focus:border-[#FF5A00] outline-none transition-colors text-white" />
                       </label>
                       <label htmlFor="estimate-city" className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#c9c1b4]">
                         City
                         <input id="estimate-city" name="city" autoComplete="address-level2" required type="text" value={city} onChange={e => setCity(e.target.value)} className="bg-[#050505] border border-white/10 p-3 text-base focus:border-[#FF5A00] outline-none transition-colors text-white" />
                       </label>
                     </div>
                     <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={status === 'submitting'} type="submit" className="w-full bg-[#FF5A00] text-white p-4 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#ff7a33] transition-colors disabled:opacity-50 mt-2 shimmer-cta">
                       {status === 'submitting' ? <Loader2 className="animate-spin" size={16} /> : 'Lock In Estimate'}
                     </motion.button>
                   </form>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

        </div>
        <div className="text-center text-xs text-gray-600 mt-2 pb-4">
          reg: ir816596 | painting
        </div>
      </section>
    </PageTransition>
  );
}
