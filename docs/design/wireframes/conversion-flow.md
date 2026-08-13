# Estimate Conversion Flow

## Journey

```text
Traffic source
  -> service or landing page
  -> relevant proof and trust
  -> estimate qualification
  -> contact and property details
  -> optional photo/document upload
  -> appointment or callback preference
  -> consent and review
  -> Convex lead created
  -> internal qualification and follow-up
```

## Desktop wireframe

```text
+--------------------------------------------------------------+
| Header: logo | services | projects | phone | Get Estimate    |
+--------------------------------------------------------------+
| Progress: 1 Service > 2 Property > 3 Contact > 4 Review      |
+------------------------------+-------------------------------+
| Main form                    | Trust panel                   |
| - service type               | - insured/local              |
| - project timing             | - response expectation       |
| - property address           | - recent review              |
| - scope notes                | - privacy statement          |
|                              |                               |
| Back              Continue   |                               |
+------------------------------+-------------------------------+
```

## Mobile wireframe

```text
+------------------------------+
| Back | Step 1 of 4           |
+------------------------------+
| Clear question               |
| Supporting explanation       |
|                              |
| Full-width controls          |
| Inline errors                |
|                              |
| Trust note                   |
|                              |
| Continue                     |
+------------------------------+
```

## Data boundary

The browser submits a validated request to an explicit server boundary. The server creates the lead in Convex, records consent and attribution, and returns a durable lead reference. No production messaging, payment, or scheduling effect occurs until the associated workflow has an approved effect policy.

## Acceptance criteria

- The flow works with keyboard only and at 320px width.
- Each step can be refreshed or resumed without duplicating a Convex lead.
- Validation is shared between client and server.
- Submission has an idempotency key.
- Errors preserve entered non-sensitive data.
- Reduced motion never changes the information architecture.
- Analytics records step completion without raw PII.
- The success state clearly states what happens next and when.
