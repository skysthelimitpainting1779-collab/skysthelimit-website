'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { Bot, Calculator, CheckCircle2, Loader2, Mail, ShieldCheck } from 'lucide-react';

import RangeSlider from '@/components/RangeSlider';
import {
  PublicContainer,
  PublicCtaLink,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { trackEvent } from '@/lib/analytics';
import { buildEstimateMailto } from '@/lib/contact';

type ProjectType = 'interior' | 'exterior' | 'cabinets';
type PrepLevel = 'standard' | 'premium';
type SubmitStatus = 'idle' | 'submitting' | 'sent' | 'fallback';

const projectOptions = [
  ['interior', 'Interior rooms'],
  ['exterior', 'Exterior painting'],
  ['cabinets', 'Cabinet refinishing'],
] as const;

function ChoiceGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  onChange: (value: string) => void;
}) {
  const labelId = `${label.toLowerCase().replaceAll(' ', '-')}-label`;
  return (
    <Field>
      <FieldLabel id={labelId}>{label}</FieldLabel>
      <ToggleGroup
        aria-labelledby={labelId}
        value={value ? [value] : []}
        onValueChange={(values) => {
          if (values[0]) onChange(values[0]);
        }}
        variant="outline"
        size="lg"
        spacing={2}
        className="grid w-full grid-cols-1 sm:grid-cols-2"
      >
        {options.map(([optionValue, optionLabel]) => (
          <ToggleGroupItem key={optionValue} value={optionValue} className="h-auto min-h-14 whitespace-normal px-4 py-3 text-left">
            {optionLabel}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}

export default function EstimatePage() {
  const [step, setStep] = useState(1);
  const [projectType, setProjectType] = useState<ProjectType | ''>('');
  const [roomType, setRoomType] = useState('Bedroom');
  const [width, setWidth] = useState(12);
  const [length, setLength] = useState(14);
  const [height, setHeight] = useState(8);
  const [stories, setStories] = useState('1 Story');
  const [siding, setSiding] = useState('Wood / LP SmartSide');
  const [cabinetCount, setCabinetCount] = useState(20);
  const [prepLevel, setPrepLevel] = useState<PrepLevel | ''>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');

  const planningRange = useMemo(() => {
    if (!projectType || !prepLevel) return null;
    let low = 0;
    let high = 0;

    if (projectType === 'interior') {
      const wallArea = 2 * (width + length) * height;
      const base = wallArea * 3.5;
      const prepValue = prepLevel === 'premium' ? base * 0.35 : 0;
      const total = base + prepValue + 250;
      low = total * 0.9;
      high = total * 1.15;
    } else if (projectType === 'exterior') {
      const base = stories === '3+ Story' ? 8500 : stories === '2 Story' ? 5500 : 3500;
      const sidingMultiplier = siding === 'Brick / Masonry' ? 1.4 : siding === 'Stucco' ? 1.3 : 1;
      const total = base * sidingMultiplier * (prepLevel === 'premium' ? 1.3 : 1);
      low = total * 0.85;
      high = total * 1.2;
    } else {
      const total = cabinetCount * (prepLevel === 'premium' ? 150 : 115);
      low = total * 0.9;
      high = total * 1.15;
    }

    return {
      low: Math.round(low / 100) * 100,
      high: Math.round(high / 100) * 100,
    };
  }, [cabinetCount, height, length, prepLevel, projectType, siding, stories, width]);

  const projectDetail = projectType === 'interior'
    ? `${roomType}, ${width} × ${length} × ${height} ft`
    : projectType === 'exterior'
      ? `${stories}, ${siding}`
      : projectType === 'cabinets'
        ? `${cabinetCount} doors and drawers`
        : 'Not selected';

  const fallbackMailto = buildEstimateMailto({
    Name: name,
    Phone: phone,
    Email: email,
    City: city,
    Project: projectType || '',
    Details: projectDetail,
    Preparation: prepLevel || '',
    'Planning range': planningRange ? `$${planningRange.low.toLocaleString()} to $${planningRange.high.toLocaleString()}` : '',
  });

  const chooseProject = (value: string) => {
    const selected = value as ProjectType;
    setProjectType(selected);
    setStep(2);
    trackEvent('estimate_step_select', { step: 'project_type', value: selected });
  };

  const continueToPrep = () => {
    setStep(3);
    trackEvent('estimate_step_select', { step: 'project_details', value: projectDetail });
  };

  const showRange = () => {
    if (!prepLevel) return;
    setStep(4);
    trackEvent('estimate_range_view', { projectType, prepLevel });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      source: 'Chatbot Estimate',
      page: '/estimate',
      name,
      phone,
      email,
      city,
      projectType,
      prepLevel,
      notes: `Project: ${projectType}\nDetails: ${projectDetail}\nPrep: ${prepLevel}\nPlanning range: ${planningRange ? `$${planningRange.low.toLocaleString()} to $${planningRange.high.toLocaleString()}` : 'Not available'}`,
    };

    setStatus('submitting');
    trackEvent('estimate_lead_submit', { projectType, prepLevel });
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setStatus(response.ok ? 'sent' : 'fallback');
    } catch {
      setStatus('fallback');
    }
  };

  const assistantMessage = step === 1
    ? 'What kind of project are you planning?'
    : step === 2
      ? 'Add the few details that change surface area and access.'
      : step === 3
        ? 'Choose the preparation level that best matches the condition.'
        : 'Here is the rough planning range. A walkthrough turns it into a firm written scope.';

  return (
    <PublicPage>
      <PublicSection tone="soft" ruled>
        <PublicContainer className="max-w-6xl">
          <PublicSectionHeading
            as="h1"
            eyebrow="Guided project estimator"
            title="Twin Cities Room Painting Cost Calculator"
            description="Get a useful price range in about one minute. Answer the surface questions first; contact details are requested only after the planning range is visible."
          />

          <Card variant="panel" className="mt-10 overflow-hidden">
            <CardHeader className="border-b border-border">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="public-display text-3xl">Project pricing assistant</CardTitle>
                  <CardDescription>Rough planning only. Final pricing follows an owner-led scope review. MN registration IR816596.</CardDescription>
                </div>
                <Badge variant="trust">Step {step} of 4</Badge>
              </div>
              <Progress value={step * 25} className="mt-4">
                <ProgressLabel>Estimator progress</ProgressLabel>
                <ProgressValue />
              </Progress>
            </CardHeader>

            <CardContent className="grid gap-0 p-0 lg:grid-cols-[0.72fr_1.28fr]">
              <aside data-tone="ink" className="border-b border-border bg-background p-6 text-foreground lg:border-b-0 lg:border-r lg:p-8">
                <Bot aria-hidden="true" className="text-primary" />
                <p className="public-display mt-6 text-3xl leading-tight">{assistantMessage}</p>
                <Separator className="my-8" />
                <dl className="grid gap-5 text-sm">
                  <div>
                    <dt className="font-bold text-muted-foreground">Project</dt>
                    <dd className="mt-1 font-semibold text-foreground">{projectType ? projectOptions.find(([value]) => value === projectType)?.[1] : 'Waiting for selection'}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-muted-foreground">Details</dt>
                    <dd className="mt-1 font-semibold text-foreground">{projectDetail}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-muted-foreground">Preparation</dt>
                    <dd className="mt-1 font-semibold capitalize text-foreground">{prepLevel || 'Not selected'}</dd>
                  </div>
                </dl>
              </aside>

              <div className="min-h-[34rem] bg-card p-6 text-card-foreground sm:p-8 lg:p-10" aria-live="polite">
                {step === 1 ? (
                  <ChoiceGroup label="Project type" value={projectType} options={projectOptions} onChange={chooseProject} />
                ) : null}

                {step === 2 && projectType === 'interior' ? (
                  <FieldGroup>
                    <ChoiceGroup
                      label="Room type"
                      value={roomType}
                      options={['Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Hallway', 'Other'].map((item) => [item, item] as const)}
                      onChange={setRoomType}
                    />
                    <div className="grid gap-6 md:grid-cols-3">
                      <RangeSlider id="estimate-width" label="Width" value={width} min={5} max={40} suffix="FT" onChange={setWidth} />
                      <RangeSlider id="estimate-length" label="Length" value={length} min={5} max={40} suffix="FT" onChange={setLength} />
                      <RangeSlider id="estimate-height" label="Ceiling height" value={height} min={7} max={20} suffix="FT" onChange={setHeight} />
                    </div>
                    <Button type="button" size="marketing-lg" onClick={continueToPrep}>Continue to Preparation</Button>
                  </FieldGroup>
                ) : null}

                {step === 2 && projectType === 'exterior' ? (
                  <FieldGroup>
                    <ChoiceGroup label="Home height" value={stories} options={['1 Story', '2 Story', '3+ Story'].map((item) => [item, item] as const)} onChange={setStories} />
                    <ChoiceGroup label="Primary siding" value={siding} options={['Wood / LP SmartSide', 'Stucco', 'Vinyl / Aluminum', 'Brick / Masonry'].map((item) => [item, item] as const)} onChange={setSiding} />
                    <Button type="button" size="marketing-lg" onClick={continueToPrep}>Continue to Preparation</Button>
                  </FieldGroup>
                ) : null}

                {step === 2 && projectType === 'cabinets' ? (
                  <FieldGroup>
                    <RangeSlider id="estimate-cabinet-count" label="Total doors and drawers" value={cabinetCount} min={5} max={60} onChange={setCabinetCount} />
                    <Button type="button" size="marketing-lg" onClick={continueToPrep}>Continue to Preparation</Button>
                  </FieldGroup>
                ) : null}

                {step === 3 ? (
                  <FieldGroup>
                    <ChoiceGroup
                      label="Preparation level"
                      value={prepLevel}
                      options={[
                        ['standard', 'Standard prep: spot repairs and minor caulk where specified'],
                        ['premium', 'Detail prep: expanded sanding, caulking, and stabilization'],
                      ]}
                      onChange={(value) => setPrepLevel(value as PrepLevel)}
                    />
                    <FieldDescription>Final preparation requirements are confirmed after surface inspection.</FieldDescription>
                    <Button type="button" size="marketing-lg" onClick={showRange} disabled={!prepLevel}>
                      <Calculator data-icon="inline-start" />
                      Show My Planning Range
                    </Button>
                  </FieldGroup>
                ) : null}

                {step === 4 && planningRange ? (
                  <div className="grid gap-8">
                    <Card variant="proof">
                      <CardHeader>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-trust">Rough planning range</p>
                        <CardTitle className="public-display text-5xl tabular-nums">
                          ${planningRange.low.toLocaleString()} to ${planningRange.high.toLocaleString()}
                        </CardTitle>
                        <CardDescription>This is a planning range, not a proposal. Surface condition, access, repairs, product, and final scope can change it.</CardDescription>
                      </CardHeader>
                    </Card>

                    {status === 'sent' ? (
                      <Card variant="proof">
                        <CardHeader>
                          <CheckCircle2 aria-hidden="true" className="text-trust" />
                          <CardTitle>Request received.</CardTitle>
                          <CardDescription>Anthony will use these details to follow up about the walkthrough and written scope.</CardDescription>
                        </CardHeader>
                      </Card>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <FieldGroup>
                          <div className="grid gap-5 sm:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor="estimate-name">Name</FieldLabel>
                              <Input id="estimate-name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="estimate-phone">Phone</FieldLabel>
                              <Input id="estimate-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="estimate-email">Email</FieldLabel>
                              <Input id="estimate-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="estimate-city">City</FieldLabel>
                              <Input id="estimate-city" name="city" autoComplete="address-level2" required value={city} onChange={(event) => setCity(event.target.value)} />
                            </Field>
                          </div>
                          <Field>
                            <Button type="submit" size="marketing-lg" disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
                              {status === 'submitting' ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <ShieldCheck data-icon="inline-start" />}
                              {status === 'submitting' ? 'Sending Request' : 'Request the Owner Walkthrough'}
                            </Button>
                            <FieldDescription>Your information is used only to respond to this project request.</FieldDescription>
                          </Field>
                        </FieldGroup>
                      </form>
                    )}

                    {status === 'fallback' ? (
                      <Card variant="proof">
                        <CardHeader>
                          <CardTitle>The form needs an email fallback.</CardTitle>
                          <CardDescription>Your selections are ready in a prefilled email. Review and send it directly to Anthony.</CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <PublicCtaLink href={fallbackMailto} icon={Mail} iconPosition="start" className="w-full">Open Prefilled Email</PublicCtaLink>
                        </CardFooter>
                      </Card>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
