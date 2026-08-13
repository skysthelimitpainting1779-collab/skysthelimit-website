---
name: motion
description: Best practices for implementing fluid, highly-performant animations using the modern Motion library (formerly framer-motion).
---

# Motion (framer-motion) Best Practices

We use `motion` (v12+), which is the modern rebranded version of `framer-motion`.

## Core Guidelines
1. **Always import from `motion/react`**, NEVER `framer-motion`.
2. **Performance First**: Animate `transform` (x, y, scale) and `opacity`. Avoid animating layout properties (width, height, top, left) directly unless using `layoutId` or `layout`.
3. **Use the `motion` component**: Replace standard HTML tags with `motion.div`, `motion.span`, etc., when animating.

## Example: Fade In Up
```tsx
import { motion } from "motion/react";

export function FadeInUp({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
```

## Staggered Children
```tsx
import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function List({ items }) {
  return (
    <motion.ul variants={container} initial="hidden" animate="show">
      {items.map(i => (
        <motion.li key={i.id} variants={item}>{i.text}</motion.li>
      ))}
    </motion.ul>
  );
}
```

## Important Notes
- Always honor `prefers-reduced-motion`. In CSS or global settings, respect users who disable animations.
- When creating UI/UX updates with `ui-ux-pro-max`, integrate `motion/react` to add premium feel without sacrificing load times.
