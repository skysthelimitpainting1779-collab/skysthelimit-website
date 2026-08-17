'use client';

import { type FormEvent, useState } from 'react';
import { CheckCircle2, MessageSquare, ShieldAlert, Star } from 'lucide-react';

import {
  PublicContainer,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
  PublicSplitCard,
} from '@/components/public/PublicSystem';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ENV } from '@/lib/env';
import { trackEvent } from '@/lib/analytics';

const googleReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJ8d-Nq98d9kgR50-mR-K5k84';

export default function ReviewPage() {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [privateFeedback, setPrivateFeedback] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privateError, setPrivateError] = useState('');

  const handleRatingSelect = (selectedRating: number) => {
    setRating(selectedRating);
    setPrivateError('');
    trackEvent('review_rating_select', { rating: selectedRating });
  };

  const handlePrivateSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!privateFeedback.trim()) {
      setPrivateError('Please add a few details so we can understand what needs attention.');
      return;
    }

    setIsSubmitting(true);
    setPrivateError('');
    trackEvent('private_feedback_submit', { rating: rating ?? undefined });

    try {
      const formId = ENV.FORMSPREE_FORM_ID || 'xanybvkd';
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Client Feedback Alert (${rating} Stars)`,
          name: clientName,
          phone: clientPhone,
          rating,
          feedback: privateFeedback,
        }),
      });
      if (response.ok) setFeedbackSubmitted(true);
      else setPrivateError('The private feedback form did not send. Please call or text 651-410-4196 so we can handle this directly.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setPrivateError('The private feedback form did not respond. Please call or text 651-410-4196 so we can handle this directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPage>
      <PublicSection tone="soft" ruled>
        <PublicContainer className="max-w-3xl">
          <PublicSectionHeading
            eyebrow="Client care"
            title="How did we do?"
            description="Rate the completed experience. Strong feedback can be shared publicly, while concerns go directly to Anthony for personal follow-up."
            align="center"
          />

          <div className="mt-10">
            <PublicSplitCard title="Rate the experience" description="Choose one to five stars.">
              {rating === null ? (
                <Field>
                  <FieldLabel id="rating-label">Project rating</FieldLabel>
                  <ToggleGroup
                    aria-labelledby="rating-label"
                    value={[]}
                    onValueChange={(values) => {
                      const selected = Number(values[0]);
                      if (selected) handleRatingSelect(selected);
                    }}
                    spacing={2}
                    className="w-full justify-center"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <ToggleGroupItem key={star} value={String(star)} variant="outline" size="lg" aria-label={`${star} star${star === 1 ? '' : 's'}`}>
                        <Star aria-hidden="true" className="group-data-[pressed]:fill-current" />
                        <span className="sr-only">{star} star rating</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>
              ) : rating >= 4 ? (
                <div className="text-center">
                  <CheckCircle2 aria-hidden="true" className="mx-auto text-trust" />
                  <h2 className="public-display mt-5 text-4xl">Thank you for the strong rating.</h2>
                  <p className="mt-4 leading-7 text-muted-foreground">A short Google review helps the next homeowner verify a local owner-operated contractor before reaching out.</p>
                  <Button
                    render={<a href={googleReviewUrl} target="_blank" rel="noopener noreferrer" />}
                    nativeButton={false}
                    size="marketing-lg"
                    className="mt-8 w-full"
                    onClick={() => trackEvent('google_review_redirect_click', { rating })}
                  >
                    Leave a Google Review
                  </Button>
                  <Button type="button" variant="link" onClick={() => setRating(null)} className="mt-3">Change rating</Button>
                </div>
              ) : feedbackSubmitted ? (
                <div className="text-center">
                  <CheckCircle2 aria-hidden="true" className="mx-auto text-trust" />
                  <h2 className="public-display mt-5 text-4xl">Feedback received.</h2>
                  <p className="mt-4 leading-7 text-muted-foreground">Thank you, {clientName}. Anthony will use the contact details you provided to follow up directly.</p>
                </div>
              ) : (
                <form onSubmit={handlePrivateSubmit}>
                  <div className="mb-6 flex items-start gap-4 border-l-[3px] border-l-trust bg-muted p-5">
                    <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0 text-trust" />
                    <div>
                      <h2 className="font-bold text-foreground">We want to understand what needs attention.</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">Anthony personally reviews this private feedback and follows up directly.</p>
                    </div>
                  </div>
                  <FieldGroup>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="review-name">Your name</FieldLabel>
                        <Input id="review-name" required value={clientName} onChange={(event) => setClientName(event.target.value)} autoComplete="name" />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="review-phone">Phone number</FieldLabel>
                        <Input id="review-phone" type="tel" required value={clientPhone} onChange={(event) => setClientPhone(event.target.value)} autoComplete="tel" />
                      </Field>
                    </div>
                    <Field data-invalid={Boolean(privateError)}>
                      <FieldLabel htmlFor="review-feedback">What could we have done better?</FieldLabel>
                      <Textarea
                        id="review-feedback"
                        required
                        rows={5}
                        value={privateFeedback}
                        onChange={(event) => setPrivateFeedback(event.target.value)}
                        aria-invalid={Boolean(privateError)}
                        aria-describedby={privateError ? 'review-feedback-error' : undefined}
                      />
                      <FieldDescription>Include the surface, room, or service detail that needs attention.</FieldDescription>
                      <FieldError id="review-feedback-error">{privateError}</FieldError>
                    </Field>
                    <Field>
                      <Button type="submit" size="marketing-lg" disabled={isSubmitting} aria-busy={isSubmitting}>
                        <MessageSquare data-icon="inline-start" />
                        {isSubmitting ? 'Sending Feedback' : 'Send Private Feedback'}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              )}
            </PublicSplitCard>
          </div>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
