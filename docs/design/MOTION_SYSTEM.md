# Motion System

Motion communicates hierarchy, state, causality, and completion. It must not delay conversion, obscure content, or compensate for weak information architecture.

## Technical baseline

- Package: `motion`
- React imports: `motion/react`
- Next.js server-compatible import when appropriate: `motion/react-client`
- App Router components using hooks or gesture state must be Client Components.

## Performance rules

- Prefer `transform` and `opacity`.
- Avoid animating layout properties such as width, height, top, and left.
- Use layout animation only when it clarifies a real state transition.
- Do not scroll-jack.
- Do not animate essential content from an inaccessible state.
- Keep routine feedback fast; longer motion is reserved for meaningful transitions.

## Accessibility rules

- Every reusable primitive checks `useReducedMotion`.
- Reduced motion removes translation, scaling, parallax, and prolonged sequencing.
- Focus, validation, loading, and completion state must remain understandable without motion.
- Hover behavior must have keyboard and touch equivalents.

## Tokens

Durations: instant 100ms, fast 180ms, normal 280ms, slow 420ms.
Distances: subtle 8px, normal 16px, strong 28px.
Default spring: stiffness 420, damping 34, mass 0.8.

## Approved primitives

- `Reveal`: content entrance with reduced-motion fallback.
- `Stagger` and `StaggerItem`: grouped hierarchy reveal.
- `Pressable`: hover, focus, and tap feedback for interactive controls.

New animation patterns require a named user-purpose, reduced-motion behavior, performance review, and visual-regression evidence.
