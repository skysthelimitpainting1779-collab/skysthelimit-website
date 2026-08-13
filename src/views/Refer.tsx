'use client';

import { useState, FormEvent } from 'react';
import { Gift, Copy, Check, Mail, MessageSquare, ShieldCheck, ArrowRight, Share2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { trackEvent } from '../lib/analytics';
import { ENV } from '../lib/env';

export default function ReferPage() {
  const [email, setEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const siteUrl = ENV.SITE_URL || window.location.origin;
    const link = `${siteUrl.replace(/\/$/, '')}/?ref=${encodeURIComponent(cleanEmail)}`;
    setGeneratedLink(link);
    setCopied(false);
    trackEvent('referral_link_generated', { email: cleanEmail });
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    trackEvent('referral_link_copied', { link: generatedLink });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = "Hey! I used Sky's the Limit Painting and they do high-detail work. If you need any interior/exterior painting done, you can get $100 off your project using my referral link here:";
  
  const smsHref = `sms:?&body=${encodeURIComponent(`${shareText} ${generatedLink}`)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent("Get $100 off your painting project!")}&body=${encodeURIComponent(`${shareText}\n\n${generatedLink}`)}`;

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#070706] py-24 px-6 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070706_0%,rgba(7,7,6,0.92)_35%,rgba(7,7,6,0.65)_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#070706] via-transparent to-transparent"></div>
        <div className="blueprint-grid absolute inset-0 opacity-18"></div>
        <div className="road-rule absolute left-0 top-0 h-1 w-full opacity-70"></div>

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 border border-white/30 bg-[#070706]/70 px-4 py-2 text-xs font-semibold text-white mb-6">
              <Gift size={12} /> Word-of-Mouth Network
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-black mb-6 leading-[0.96] text-white">
              Share the work.<br />
              <span className="text-white">Share the reward.</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              We build our business on quality and trust, not aggressive marketing campaigns. When you refer friends, neighbors, or colleagues, we reward both of you. They get $100 off their estimate, and you get $100 cash once the work wraps.
            </p>
          </div>
          <div className="lg:col-span-5 bg-[#11100d]/90 border border-[#d8c7aa]/16 p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-black text-white mb-2">Create sharing link</h2>
            <p className="text-xs text-gray-400 mb-6">Enter your email below to instantly generate your unique referral tracking link.</p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label htmlFor="referrer-email" className="block text-xs font-semibold text-[#c9c1b4] mb-2">
                  Your Email Address
                </label>
                <input
                  id="referrer-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-white/15 bg-[#070706] p-4 text-sm text-white focus-visible:ring-2 focus-visible:ring-[white] focus:outline-none placeholder:text-gray-600"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-white px-7 py-4 text-sm font-semibold text-[#15110a] hover:bg-white transition-colors"
              >
                Generate Link <ArrowRight size={18} />
              </button>
            </form>

            {generatedLink && (
              <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#c9c1b4] mb-2">Your Referral Link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full border border-white/15 bg-[#070706] p-3 text-xs text-gray-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="bg-white text-[#15110a] px-4 hover:bg-white transition-colors"
                      title="Copy link to clipboard"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  {copied && <p className="text-xs text-white mt-1 font-bold">Copied to clipboard!</p>}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={smsHref}
                    onClick={() => trackEvent('referral_share_sms', { email })}
                    className="inline-flex items-center justify-center gap-2 border border-white/10 bg-[#070706] py-3 text-xs font-black text-white hover:border-white hover:text-white transition-colors"
                  >
                    <MessageSquare size={14} /> Send Text
                  </a>
                  <a
                    href={mailHref}
                    onClick={() => trackEvent('referral_share_email', { email })}
                    className="inline-flex items-center justify-center gap-2 border border-white/10 bg-[#070706] py-3 text-xs font-black text-white hover:border-white hover:text-white transition-colors"
                  >
                    <Mail size={14} /> Send Email
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* The 3-Step Referral Loop */}
      <section className="bg-[#11100d] py-24 px-6 text-white border-b border-[#d8c7aa]/16 relative">
        <div className="measurement-rules absolute inset-0 opacity-12"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold text-white">Simple loop</p>
            <h2 className="text-3xl md:text-5xl font-display font-black leading-none mt-4">How it works</h2>
            <p className="text-sm text-gray-400 mt-4 leading-relaxed">
              No points, no coupon portals, no complex points structures. Just direct word-of-mouth incentives paid directly to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Enter & generate',
                body: 'Type in your email address above to get your custom tracking link. We use this email to know who to reward.',
              },
              {
                step: '02',
                title: 'Share the paint',
                body: 'Share the link with friends, family, or neighbors. When they click the link, their browser remembers that you referred them.',
              },
              {
                step: '03',
                title: 'Collect your check',
                body: 'Your friend gets $100 off their exterior or interior painting project. Once their contract completes, we mail you a $100 check or send it digitally.',
              },
            ].map((item, idx) => (
              <div key={idx} className="border-l border-white/35 bg-[#070706]/70 p-8 flex flex-col justify-between min-h-[220px]">
                <div className="flex justify-between items-start">
                  <span className="font-display text-4xl font-black text-white/10">{item.step}</span>
                  <span className="p-2 border border-white/10 bg-white/5 text-white">
                    <Share2 size={16} />
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mt-6">{item.title}</h3>
                  <p className="text-sm text-gray-400 mt-3 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules & FAQ Section */}
      <section className="bg-[#070706] py-24 px-6 text-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-display font-black text-white mb-10 text-center">Frequently asked questions</h2>
          
          <div className="space-y-8">
            {[
              {
                q: 'Is there a limit to how many friends I can refer?',
                a: 'No. There is no limit. You can refer 1 friend or 10. You will receive $100 cash check for every single person who completes a project with us.',
              },
              {
                q: 'How does my friend get their $100 discount?',
                a: 'When they request their estimate (via the Contact Page form or the Room Cost Calculator), our system detects your email. Anthony will automatically apply a $100 discount to their finalized proposal.',
              },
              {
                q: 'How and when do I receive my $100 check?',
                a: 'Once your friend’s painting project is finished and their invoice is settled, we will contact you at your generated email to confirm your preferred address (to mail a check) or account details (for Venmo or Zelle/Zilla). Payments are sent out within 5 business days of invoice settlement.',
              },
              {
                q: 'Who qualifies as a referral?',
                a: 'Referrals must be new customers to Sky’s the Limit Painting LLC. Projects must have a minimum contract value of $1,000 to qualify for the $100 referral discount and referrer check.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-white/10 pb-6">
                <h3 className="text-lg font-black text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-[#e4ded2] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 border border-white/20 bg-[#11100d] p-6 text-center">
            <h3 className="text-xl font-black text-white mb-2">MN Contractor Transparency</h3>
            <p className="text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
              Sky’s the Limit Painting LLC is an owner-operated registered MN specialty contractor (Registration ID: IR816596) based in Inver Grove Heights. All referrals are subject to verification. Owner is exempt from standard workers’ comp rules under MN Statute 176.041.
            </p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
