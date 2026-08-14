# Estimate & Lead Intake Flow Architecture

**Architecture Reference Note** · Verified via Graphify AST Discovery

---

## 1. Route-to-Component Mapping

| Layer | File Path | Symbol / Export | Responsibility | Classification |
|-------|-----------|-----------------|----------------|----------------|
| **Next.js Page** | `src/app/estimate/page.tsx` | `default function Estimate()` | Server Component, SEO metadata (`generateMetadata`) | **PRODUCT_CORE** (consumes CUSTOMER_CONTENT) |
| **Primary View** | `src/views/Estimate.tsx` | `EstimatePage` | Interactive service cost estimator | **PRODUCT_CORE** (consumes CUSTOMER_CONFIG) |
| **Booking Component** | `src/components/CalBooking.tsx` | `CalBooking` | Scheduling / calendar booking integration | **PRODUCT_CORE** (consumes INTEGRATION_CONFIG) |
| **Lead Capture** | `src/components/LeadForm.tsx` | `LeadForm()` | Form inputs, validation, UTM param capture | **PRODUCT_CORE** |
| **Route Handler** | `src/app/api/leads/route.ts` | `export async function POST()` | API Route Handler, rate limiting, persistence | **PRODUCT_CORE** (consumes ENVIRONMENT_CONFIG) |

---

## 2. Productization Classification

Per `A2 Productizer` boundary governance:
- **PRODUCT_CORE**: Cost calculation logic, step progression, input validation, rate limiting.
- **CUSTOMER_CONFIG**: Service pricing multiplier, email notification targets.
- **CUSTOMER_CONTENT**: Service presets, marketing copy, guarantee badges.
- **ENVIRONMENT_CONFIG**: Deployment-specific environment variables.
- **SEED_DATA**: Initial data population.
- **INTEGRATION_CONFIG**: Booking embed URLs and external service connections.
