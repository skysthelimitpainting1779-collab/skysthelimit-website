# Responsive UI Verification

## Trigger
Use before accepting any page, form, navigation, dashboard, or substantial component change.

## Required context
Read the relevant wireframe and component implementation. Query Context7 when framework or component-library behavior affects responsiveness.

## Procedure
1. Verify 320px, 375px, 768px, 1024px, and wide desktop layouts.
2. Check content order, overflow, wrapping, sticky elements, dialogs, tables, and touch targets.
3. Verify primary actions remain reachable without covering content.
4. Test keyboard navigation and zoom to 200 percent.
5. Compare implementation against both mobile and desktop wireframe contracts.

## Test and verification
Run focused tests, `npm run lint:ci`, automated browser checks where available, screenshots for required viewports, and canonical Vercel Preview inspection.

## Stop conditions
Stop for horizontal page overflow, clipped controls, inaccessible dialogs, touch targets below 44px, content hidden by sticky UI, or unapproved wireframe divergence.

## Evidence
Record viewport matrix, failures and fixes, Context7 references, screenshots or browser output, exact commit SHA, and Preview URL.
