'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calculator, CheckCircle2, ClipboardList, FileText, Loader2, PackageSearch, Plus, Printer, RefreshCw, Save, Settings2, Users } from 'lucide-react';

import { calculateEstimate } from '@/lib/estimating/calculations';
import { createDraftEstimate, createEmptyWorkspace, createId, nowIso } from '@/lib/estimating/seed';
import { loadEstimatorWorkspace, saveEstimatorWorkspace } from '@/lib/estimating/store';
import type { EstimateDraft, EstimatorWorkspace, Job, MaterialSelection, PriceCandidate } from '@/lib/estimating/types';

type ContractorEstimatorProps = {
  contractorEmail: string;
};

type Channel3ProductCandidate = { id: string; title: string; lowestOffer?: { domain: string; price: number; currency: string } };

type PricingResponse = {
  products: Channel3ProductCandidate[];
  resolution: { selected?: PriceCandidate; reason: string };
  livePricingError?: string;
  error?: string;
};

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function NumberField({ label, value, onChange, min = 0, step = 1, suffix }: { label: string; value: number; onChange: (value: number) => void; min?: number; step?: number; suffix?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <span className="relative">
        <input
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 pr-12 text-base font-semibold text-slate-950 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
        />
        {suffix ? <span className="pointer-events-none absolute right-3 top-3 text-xs font-bold uppercase tracking-wide text-slate-500">{suffix}</span> : null}
      </span>
    </label>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function NavItem({ href, icon: Icon, children }: { href: string; icon: typeof Calculator; children: React.ReactNode }) {
  return (
    <a href={href} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </a>
  );
}

export default function ContractorEstimator({ contractorEmail }: ContractorEstimatorProps) {
  const [workspace, setWorkspace] = useState<EstimatorWorkspace | null>(null);
  const [draft, setDraft] = useState<EstimateDraft | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [pricingBusy, setPricingBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [channel3Results, setChannel3Results] = useState<Record<string, Channel3ProductCandidate[]>>({});

  useEffect(() => {
    const loaded = loadEstimatorWorkspace();
    setWorkspace(loaded);
    setDraft(createDraftEstimate());
  }, []);

  useEffect(() => {
    if (workspace) saveEstimatorWorkspace(workspace);
  }, [workspace]);

  const calculation = useMemo(() => draft ? calculateEstimate(draft) : null, [draft]);
  const customerPrice = finalPrice ?? calculation?.recommendedPrice ?? 0;

  const updateDraft = (updater: (current: EstimateDraft) => EstimateDraft) => {
    setDraft((current) => current ? { ...updater(current), updatedAt: nowIso() } : current);
  };

  const updateMaterial = (materialId: string, updates: Partial<MaterialSelection>) => {
    updateDraft((current) => ({
      ...current,
      materials: current.materials.map((material) => material.id === materialId ? { ...material, ...updates } : material),
    }));
  };

  const refreshPrice = async (material: MaterialSelection, productId?: string) => {
    if (!workspace || !draft) return;
    setPricingBusy(material.id);
    setNotice('');
    const cacheKey = material.name.trim().toLowerCase();
    try {
      const response = await fetch('/api/material-pricing/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: [material.manufacturer, material.name, material.finish].filter(Boolean).join(' '),
          productId,
          cached: workspace.priceCache[cacheKey],
          contractor: workspace.contractorPrices[cacheKey],
          manual: material.priceSource === 'manual' ? {
            price: material.unitPrice,
            source: 'manual',
            supplier: material.supplier,
            product: material.name,
            enteredBy: contractorEmail,
            notes: material.manualPriceNotes,
          } : undefined,
        }),
      });
      const result = await response.json() as PricingResponse;
      if (!response.ok || result.error) throw new Error(result.error || 'Live material pricing could not be checked.');

      if (!productId) {
        setChannel3Results((current) => ({ ...current, [material.id]: result.products }));
        setNotice(result.products.length > 0
          ? 'Select a matching product offer and verify its container size before applying a live price.'
          : 'Live pricing returned no usable matching product. The existing cached, saved contractor, or manual price remains available.');
        return;
      }

      const selected = result.resolution.selected;
      if (!selected) {
        setNotice('No usable live, cached, saved, or manual price was available. Enter a contractor price to continue.');
        return;
      }

      const source = result.resolution.reason === 'channel3' ? 'channel3' : selected.source;
      updateMaterial(material.id, {
        unitPrice: selected.price,
        priceSource: source,
        supplier: selected.supplier || material.supplier,
        priceUpdatedAt: selected.retrievedAt || nowIso(),
      });
      if (result.resolution.reason === 'channel3') {
        setWorkspace((current) => current ? {
          ...current,
          priceCache: {
            ...current.priceCache,
            [cacheKey]: { ...selected, source: 'cache' },
          },
        } : current);
        setNotice(`Live Channel3 price applied for ${material.name}.`);
      } else {
        setNotice(`Live pricing was unavailable. Using the ${result.resolution.reason.replaceAll('_', ' ')} price for ${material.name}.`);
      }
    } catch {
      setNotice('Live pricing is unavailable. Enter or save a contractor price; the estimate remains usable.');
    } finally {
      setPricingBusy(null);
    }
  };

  const saveEstimate = () => {
    if (!workspace || !draft || !calculation) return;
    const timestamp = nowIso();
    const matchedCustomer = draft.customerId ? workspace.customers.find((customer) => customer.id === draft.customerId) : undefined;
    const customer = matchedCustomer || (draft.customerName.trim() ? {
      id: createId('customer'),
      name: draft.customerName.trim(),
      address: draft.propertyAddress,
      createdAt: timestamp,
      updatedAt: timestamp,
    } : undefined);
    const storedDraft = { ...draft, customerId: customer?.id, updatedAt: timestamp };

    setDraft(storedDraft);
    setWorkspace((current) => current ? {
      ...current,
      customers: customer && !matchedCustomer ? [customer, ...current.customers] : current.customers,
      estimates: [storedDraft, ...current.estimates.filter((estimate) => estimate.id !== storedDraft.id)],
    } : current);
    setNotice(`Estimate saved. Recommended customer price: ${money.format(customerPrice)}.`);
  };

  const createJobAndInvoices = () => {
    if (!workspace || !draft || !calculation) return;
    const timestamp = nowIso();
    const matchedCustomer = draft.customerId ? workspace.customers.find((customer) => customer.id === draft.customerId) : undefined;
    const customer = matchedCustomer || (draft.customerName.trim() ? {
      id: createId('customer'),
      name: draft.customerName.trim(),
      address: draft.propertyAddress,
      createdAt: timestamp,
      updatedAt: timestamp,
    } : undefined);
    const job: Job = {
      id: createId('job'),
      estimateId: draft.id,
      customerId: customer?.id,
      name: draft.jobName,
      status: 'accepted',
      acceptedPrice: customerPrice,
      estimatedCost: calculation.totalCost,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const invoicePercentages = [
      { label: 'Deposit', percent: draft.settings.paymentDepositPercent },
      { label: 'Progress', percent: draft.settings.paymentProgressPercent },
      { label: 'Final', percent: draft.settings.paymentFinalPercent },
    ];
    const invoices = invoicePercentages.map((item) => ({
      id: createId('invoice'),
      jobId: job.id,
      status: 'draft' as const,
      amount: Math.round(customerPrice * item.percent * 100) / 100,
      dueDate: undefined,
      createdAt: timestamp,
    }));

    const acceptedDraft = { ...draft, customerId: customer?.id, status: 'accepted' as const, updatedAt: timestamp };
    setDraft(acceptedDraft);
    setWorkspace((current) => current ? {
      ...current,
      customers: customer && !matchedCustomer ? [customer, ...current.customers] : current.customers,
      estimates: [acceptedDraft, ...current.estimates.filter((estimate) => estimate.id !== acceptedDraft.id)],
      jobs: [job, ...current.jobs],
      invoices: [...invoices, ...current.invoices],
    } : current);
    setNotice('Accepted estimate converted to a job with deposit, progress, and final invoice drafts.');
  };

  const updateJobActual = (jobId: string, updates: Partial<Job>) => {
    setWorkspace((current) => current ? {
      ...current,
      jobs: current.jobs.map((job) => job.id === jobId ? { ...job, ...updates, updatedAt: nowIso() } : job),
    } : current);
  };

  const recordPayment = (invoiceId: string) => {
    setWorkspace((current) => {
      if (!current) return current;
      const invoices = current.invoices.map((invoice) => invoice.id === invoiceId ? { ...invoice, status: 'paid' as const } : invoice);
      const paidInvoice = invoices.find((invoice) => invoice.id === invoiceId);
      const jobs = paidInvoice && invoices.filter((invoice) => invoice.jobId === paidInvoice.jobId).every((invoice) => invoice.status === 'paid')
        ? current.jobs.map((job) => job.id === paidInvoice.jobId ? { ...job, status: 'paid' as const, updatedAt: nowIso() } : job)
        : current.jobs;
      return { ...current, invoices, jobs };
    });
    setNotice('Payment recorded. A job is marked paid once every associated invoice is paid.');
  };

  const addMaterial = () => {
    updateDraft((current) => ({
      ...current,
      materials: [...current.materials, {
        id: createId('material'),
        name: 'New material',
        coveragePerGallon: 350,
        coats: 1,
        wastePercent: 0.1,
        unitSizeGallons: 1,
        unitPrice: 0,
        priceSource: 'manual',
        supplier: 'Manual entry',
      }],
    }));
  };

  if (!workspace || !draft || !calculation) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 p-6 text-sm font-semibold text-slate-600">Loading estimator workspace…</main>;
  }

  const activeJobs = workspace.jobs.filter((job) => !['paid', 'closed'].includes(job.status));
  const monthlyRevenue = workspace.jobs.reduce((sum, job) => sum + job.acceptedPrice, 0);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-600">Sky’s the Limit Painting LLC</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Contractor Estimating Workspace</h1>
            <p className="mt-1 text-sm text-slate-600">Signed in as {contractorEmail}</p>
          </div>
          <nav aria-label="Estimator sections" className="flex flex-wrap gap-1">
            <NavItem href="#dashboard" icon={ClipboardList}>Dashboard</NavItem>
            <NavItem href="#new-estimate" icon={Calculator}>New estimate</NavItem>
            <NavItem href="#customers" icon={Users}>Customers</NavItem>
            <NavItem href="#material-prices" icon={PackageSearch}>Material prices</NavItem>
            <NavItem href="#settings" icon={Settings2}>Settings</NavItem>
          </nav>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6 lg:px-8">
        <div className="grid gap-5">
          {notice ? <div role="status" className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-950">{notice}</div> : null}

          <Section id="dashboard" title="Dashboard" description="A practical view of the work saved on this device.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Active estimates', workspace.estimates.filter((estimate) => ['draft', 'sent', 'revised'].includes(estimate.status)).length.toString()],
                ['Accepted jobs', activeJobs.length.toString()],
                ['Quoted revenue', money.format(monthlyRevenue)],
                ['Average planned margin', workspace.estimates.length ? `${Math.round(workspace.estimates.map(calculateEstimate).reduce((sum, result) => sum + result.grossMargin, 0) / workspace.estimates.length * 100)}%` : '—'],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-950 p-4 text-white"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-2xl font-black tabular-nums">{value}</p></div>)}
            </div>
          </Section>

          <Section id="new-estimate" title="New Estimate" description="Enter site measurements first. Every total on the right is recalculated from these inputs.">
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Customer name</span><input className="h-12 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" value={draft.customerName} onChange={(event) => updateDraft((current) => ({ ...current, customerName: event.target.value }))} placeholder="Customer name" /></label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Job name</span><input className="h-12 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" value={draft.jobName} onChange={(event) => updateDraft((current) => ({ ...current, jobName: event.target.value }))} /></label>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Property address</span><input className="h-12 rounded-xl border border-slate-300 px-3 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" value={draft.propertyAddress || ''} onChange={(event) => updateDraft((current) => ({ ...current, propertyAddress: event.target.value }))} placeholder="Street, city, state ZIP" /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Project</span><select className="h-12 rounded-xl border border-slate-300 bg-white px-3" value={draft.projectKind} onChange={(event) => updateDraft((current) => ({ ...current, projectKind: event.target.value as EstimateDraft['projectKind'] }))}><option value="interior">Interior</option><option value="exterior">Exterior</option><option value="cabinets">Cabinets</option></select></label>
                  <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Property type</span><select className="h-12 rounded-xl border border-slate-300 bg-white px-3" value={draft.propertyKind} onChange={(event) => updateDraft((current) => ({ ...current, propertyKind: event.target.value as EstimateDraft['propertyKind'] }))}><option value="residential">Residential</option><option value="commercial">Commercial</option></select></label>
                </div>
                <label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Prep level</span><div className="grid grid-cols-3 gap-2">{(['light', 'standard', 'heavy'] as const).map((level) => <button type="button" key={level} onClick={() => updateDraft((current) => ({ ...current, prepLevel: level }))} className={`min-h-12 rounded-xl border px-2 text-sm font-black capitalize ${draft.prepLevel === level ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}>{level}</button>)}</div></label>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wide text-orange-600">Room / Area</p><h3 className="text-lg font-black">Measurements & deductions</h3></div><span className="rounded-lg bg-white px-3 py-2 text-sm font-black text-slate-700 shadow-sm">{draft.room.name}</span></div>
                <div className="grid grid-cols-2 gap-3"><NumberField label="Length" value={draft.room.length} suffix="ft" onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, length: value } }))} /><NumberField label="Width" value={draft.room.width} suffix="ft" onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, width: value } }))} /><NumberField label="Ceiling height" value={draft.room.ceilingHeight} suffix="ft" onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, ceilingHeight: value } }))} /><NumberField label="Doors" value={draft.room.doors} onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, doors: value } }))} /><NumberField label="Door width" value={draft.room.doorWidth} suffix="ft" step={0.25} onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, doorWidth: value } }))} /><NumberField label="Door height" value={draft.room.doorHeight} suffix="ft" step={0.25} onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, doorHeight: value } }))} /><NumberField label="Windows" value={draft.room.windows} onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, windows: value } }))} /><NumberField label="Window width" value={draft.room.windowWidth} suffix="ft" step={0.25} onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, windowWidth: value } }))} /><NumberField label="Window height" value={draft.room.windowHeight} suffix="ft" step={0.25} onChange={(value) => updateDraft((current) => ({ ...current, room: { ...current.room, windowHeight: value } }))} /></div>
                <div className="mt-4 grid gap-2 rounded-xl bg-white p-3 text-sm"><div className="flex justify-between"><span className="text-slate-600">Wall area</span><strong>{number.format(calculation.wallArea)} sq ft</strong></div><div className="flex justify-between"><span className="text-slate-600">Openings deducted</span><strong>{number.format(calculation.openingsArea)} sq ft</strong></div><div className="flex justify-between border-t border-slate-100 pt-2"><span className="font-bold">Paintable wall area</span><strong>{number.format(calculation.paintableWallArea)} sq ft</strong></div></div>
              </div>
            </div>
          </Section>

          <Section id="material-prices" title="Materials & Current Pricing" description="Channel3 is used server-side for live product offers. The estimate remains usable with cached, saved contractor, or manual pricing.">
            <div className="grid gap-4">
              {draft.materials.map((material) => {
                const materialCalc = calculation.materialCalculations.find((item) => item.materialId === material.id);
                return <div key={material.id} className="rounded-2xl border border-slate-200 p-4"><div className="grid gap-4 lg:grid-cols-[1.25fr_repeat(5,minmax(0,1fr))]"><label className="grid gap-1.5 text-sm font-semibold text-slate-700"><span>Material</span><input className="h-12 rounded-xl border border-slate-300 px-3" value={material.name} onChange={(event) => updateMaterial(material.id, { name: event.target.value })} /></label><NumberField label="Coverage" value={material.coveragePerGallon} suffix="sq ft/gal" onChange={(value) => updateMaterial(material.id, { coveragePerGallon: value })} /><NumberField label="Container" value={material.unitSizeGallons} suffix="gal" step={0.25} onChange={(value) => updateMaterial(material.id, { unitSizeGallons: value })} /><NumberField label="Coats" value={material.coats} min={1} onChange={(value) => updateMaterial(material.id, { coats: value })} /><NumberField label="Waste" value={material.wastePercent * 100} suffix="%" onChange={(value) => updateMaterial(material.id, { wastePercent: value / 100 })} /><NumberField label="Unit price" value={material.unitPrice} suffix="USD" step={0.01} onChange={(value) => updateMaterial(material.id, { unitPrice: value, priceSource: 'manual', priceUpdatedAt: nowIso(), manualPriceNotes: 'Manual contractor override' })} /></div><div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-700"><strong>{materialCalc?.purchaseUnits ?? 0} container(s)</strong> to purchase · <strong>{money.format(materialCalc?.materialCost ?? 0)}</strong> material cost · source: <strong className="capitalize">{material.priceSource}</strong></p><div className="flex gap-2"><button type="button" onClick={() => refreshPrice(material)} disabled={pricingBusy === material.id} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60">{pricingBusy === material.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Find live offers</button><button type="button" onClick={() => updateDraft((current) => ({ ...current, materials: current.materials.filter((item) => item.id !== material.id) }))} className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-700">Remove</button></div></div>{channel3Results[material.id]?.length ? <div className="mt-3 grid gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3"><p className="text-xs font-black uppercase tracking-wide text-orange-900">Choose a verified Channel3 offer</p>{channel3Results[material.id].map((product) => <div key={product.id} className="flex flex-col gap-2 rounded-lg bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-slate-950">{product.title}</p><p className="text-xs text-slate-600">{product.lowestOffer ? `${money.format(product.lowestOffer.price)} from ${product.lowestOffer.domain}` : 'No in-stock offer returned'}</p></div><button type="button" disabled={!product.lowestOffer || pricingBusy === material.id} onClick={() => refreshPrice(material, product.id)} className="min-h-10 rounded-lg bg-orange-600 px-3 text-sm font-black text-white disabled:opacity-50">Use after package check</button></div>)}</div> : null}</div>;
              })}
              <button type="button" onClick={addMaterial} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 text-sm font-black text-slate-700 hover:border-orange-500 hover:text-orange-700"><Plus className="h-4 w-4" />Add material or supply</button>
            </div>
          </Section>

          <Section id="settings" title="Labor, Cost & Margin Settings" description="These are contractor-controlled assumptions. The gross-margin formula is applied as total cost ÷ (1 − margin).">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><NumberField label="Loaded labor rate" value={draft.settings.loadedLaborRate} step={0.5} suffix="/ hr" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, loadedLaborRate: value } }))} /><NumberField label="Wall production" value={draft.settings.wallProductionRate} suffix="sq ft/hr" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, wallProductionRate: value } }))} /><NumberField label="Crew size" value={draft.settings.crewSize} min={1} onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, crewSize: value } }))} /><NumberField label="Supplies" value={draft.settings.suppliesCost} step={1} suffix="USD" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, suppliesCost: value } }))} /><NumberField label="Equipment" value={draft.settings.equipmentCost} step={1} suffix="USD" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, equipmentCost: value } }))} /><NumberField label="Fixed overhead" value={draft.settings.fixedOverhead} step={1} suffix="USD" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, fixedOverhead: value } }))} /><NumberField label="Overhead" value={draft.settings.overheadPercent * 100} suffix="%" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, overheadPercent: value / 100 } }))} /><NumberField label="Contingency" value={draft.settings.contingencyPercent * 100} suffix="%" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, contingencyPercent: value / 100 } }))} /><NumberField label="Target gross margin" value={draft.settings.targetGrossMargin * 100} suffix="%" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, targetGrossMargin: value / 100 } }))} /><NumberField label="Price rounding" value={draft.settings.roundingIncrement} suffix="USD" onChange={(value) => updateDraft((current) => ({ ...current, settings: { ...current.settings, roundingIncrement: value } }))} /></div>
          </Section>

          <Section id="customers" title="Customers, Jobs & Invoice Tracking" description="Saved items remain on this device. Database migration support is included for the shared production deployment.">
            <div className="grid gap-5 lg:grid-cols-3"><div><h3 className="font-black">Customers</h3><p className="mt-1 text-sm text-slate-600">{workspace.customers.length} saved customer{workspace.customers.length === 1 ? '' : 's'}</p><ul className="mt-3 grid gap-2">{workspace.customers.slice(0, 4).map((customer) => <li key={customer.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><strong>{customer.name}</strong>{customer.address ? <span className="block text-slate-600">{customer.address}</span> : null}</li>)}</ul></div><div><h3 className="font-black">Jobs</h3><p className="mt-1 text-sm text-slate-600">{activeJobs.length} active job{activeJobs.length === 1 ? '' : 's'}</p><ul className="mt-3 grid gap-2">{activeJobs.slice(0, 4).map((job) => <li key={job.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><strong>{job.name}</strong><span className="block capitalize text-slate-600">{job.status.replaceAll('_', ' ')} · {money.format(job.acceptedPrice)}</span></li>)}</ul></div><div><h3 className="font-black">Invoices</h3><p className="mt-1 text-sm text-slate-600">{workspace.invoices.length} invoice draft{workspace.invoices.length === 1 ? '' : 's'}</p><ul className="mt-3 grid gap-2">{workspace.invoices.slice(0, 4).map((invoice) => <li key={invoice.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><div className="flex items-center justify-between gap-2"><div><strong>{money.format(invoice.amount)}</strong><span className="block capitalize text-slate-600">{invoice.status}</span></div>{invoice.status !== 'paid' ? <button type="button" onClick={() => recordPayment(invoice.id)} className="min-h-9 rounded-lg border border-slate-300 px-2 text-xs font-black text-slate-700">Record paid</button> : <CheckCircle2 className="h-5 w-5 text-emerald-600" />}</div></li>)}</ul></div></div>
          </Section>

          <Section id="job-costing" title="Actual Job Costing" description="Record actual labor and material results after completion to compare planned versus actual performance.">
            <div className="grid gap-4">{workspace.jobs.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Accept an estimate to begin job costing.</p> : workspace.jobs.map((job) => { const actualLaborCost = (job.actualLaborHours || 0) * draft.settings.loadedLaborRate; const actualCost = actualLaborCost + (job.actualMaterialCost || 0) + (job.actualOtherCost || 0); return <div key={job.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black">{job.name}</h3><p className="text-sm text-slate-600">Estimated cost {money.format(job.estimatedCost)} · Accepted price {money.format(job.acceptedPrice)}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-700">{job.status.replaceAll('_', ' ')}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><NumberField label="Actual labor hours" value={job.actualLaborHours || 0} step={0.25} onChange={(value) => updateJobActual(job.id, { actualLaborHours: value })} /><NumberField label="Actual material cost" value={job.actualMaterialCost || 0} step={0.01} suffix="USD" onChange={(value) => updateJobActual(job.id, { actualMaterialCost: value })} /><NumberField label="Other actual cost" value={job.actualOtherCost || 0} step={0.01} suffix="USD" onChange={(value) => updateJobActual(job.id, { actualOtherCost: value })} /></div><p className="mt-3 text-sm text-slate-700">Actual cost {money.format(actualCost)} · Estimated cost variance {money.format(actualCost - job.estimatedCost)} · Actual gross margin {job.acceptedPrice > 0 ? Math.round((job.acceptedPrice - actualCost) / job.acceptedPrice * 100) : 0}%</p></div>; })}</div>
          </Section>
        </div>

        <aside className="print:hidden lg:sticky lg:top-4 lg:h-fit">
          <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-orange-400">Contractor review</p><h2 className="mt-2 text-2xl font-black">Quote audit</h2><div className="mt-5 grid gap-3 text-sm"><div className="flex justify-between text-slate-300"><span>Materials</span><strong className="text-white">{money.format(calculation.materialCost)}</strong></div><div className="flex justify-between text-slate-300"><span>Labor · {number.format(calculation.totalLaborHours)} hr</span><strong className="text-white">{money.format(calculation.laborCost)}</strong></div><div className="flex justify-between text-slate-300"><span>Supplies & equipment</span><strong className="text-white">{money.format(calculation.suppliesAndEquipmentCost)}</strong></div><div className="flex justify-between text-slate-300"><span>Overhead</span><strong className="text-white">{money.format(calculation.overheadCost)}</strong></div><div className="flex justify-between text-slate-300"><span>Contingency</span><strong className="text-white">{money.format(calculation.contingencyCost)}</strong></div><div className="border-t border-white/15 pt-3"><div className="flex justify-between text-slate-300"><span>Total cost</span><strong className="text-white">{money.format(calculation.totalCost)}</strong></div><div className="mt-2 flex justify-between text-orange-300"><span>Target margin</span><strong>{Math.round(draft.settings.targetGrossMargin * 100)}%</strong></div></div></div><div className="mt-5 grid gap-2"><div className="rounded-xl bg-white/10 p-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-300">Minimum</span><p className="mt-1 text-xl font-black">{money.format(calculation.minimumPrice)}</p></div><div className="rounded-xl bg-orange-500 p-3 text-slate-950"><span className="text-xs font-black uppercase tracking-wide">Recommended</span><p className="mt-1 text-2xl font-black">{money.format(calculation.recommendedPrice)}</p></div><div className="rounded-xl bg-white/10 p-3"><span className="text-xs font-bold uppercase tracking-wide text-slate-300">Aggressive</span><p className="mt-1 text-xl font-black">{money.format(calculation.aggressivePrice)}</p></div></div><label className="mt-5 grid gap-1.5 text-sm font-bold"><span>Contractor-selected customer price</span><input className="h-12 rounded-xl border border-white/20 bg-white px-3 text-lg font-black text-slate-950" type="number" value={customerPrice} onChange={(event) => setFinalPrice(Number(event.target.value) || 0)} /></label><p className="mt-2 text-xs leading-5 text-slate-300">At this price: gross profit {money.format(customerPrice - calculation.totalCost)} · gross margin {customerPrice > 0 ? Math.round((customerPrice - calculation.totalCost) / customerPrice * 100) : 0}%.</p><div className="mt-5 grid gap-2"><button type="button" onClick={saveEstimate} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-slate-950"><Save className="h-4 w-4" />Save estimate</button><button type="button" onClick={createJobAndInvoices} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-black text-white"><CheckCircle2 className="h-4 w-4" />Accept & create job</button></div></div>
        </aside>
      </div>

      <section className="mx-auto hidden max-w-3xl bg-white p-8 print:block"><p className="text-xs font-bold uppercase tracking-wide text-orange-600">Sky’s the Limit Painting LLC</p><h1 className="mt-2 text-3xl font-black">Painting Estimate</h1><div className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><p className="font-bold">Customer</p><p>{draft.customerName || 'Customer name'}</p></div><div><p className="font-bold">Property</p><p>{draft.propertyAddress || 'Property address'}</p></div><div><p className="font-bold">Scope</p><p>{draft.jobName}</p></div><div><p className="font-bold">Estimated schedule</p><p>To be confirmed after final walkthrough</p></div></div><div className="mt-8 rounded-xl border-2 border-slate-950 p-5"><p className="text-sm font-bold">Customer price</p><p className="mt-1 text-4xl font-black">{money.format(customerPrice)}</p></div><div className="mt-8"><h2 className="font-black">Included work</h2><p className="mt-2 text-sm leading-6">Preparation and coating work described in the approved scope, with materials selected for the project. Final surface condition and exclusions are confirmed during the owner walkthrough.</p></div><div className="mt-6"><h2 className="font-black">Payment terms</h2><p className="mt-2 text-sm">{Math.round(draft.settings.paymentDepositPercent * 100)}% deposit, {Math.round(draft.settings.paymentProgressPercent * 100)}% progress payment, and {Math.round(draft.settings.paymentFinalPercent * 100)}% final payment. Estimate expires after the written proposal date.</p></div><div className="mt-10 border-t border-slate-300 pt-6 text-sm"><p>Acceptance: ________________________________ Date: _______________</p></div></section>

      <button type="button" onClick={() => window.print()} className="print:hidden fixed bottom-4 right-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-orange-600 px-5 text-sm font-black text-white shadow-lg"><Printer className="h-4 w-4" />Print customer estimate</button>
    </main>
  );
}
