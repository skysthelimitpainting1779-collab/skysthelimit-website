import type { LucideIcon } from 'lucide-react';
import HoverLift from './animations/HoverLift';
import { cn } from '@/lib/utils';

interface IconFeatureCardProps {
  icon: LucideIcon;
  title: string;
  body: string;
  className?: string;
  iconSize?: number;
  iconClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  headingLevel?: 'h2' | 'h3';
  as?: 'article' | 'div';
}

export default function IconFeatureCard({
  icon: Icon,
  title,
  body,
  className = 'border-l border-[#f0c067]/35 bg-[#11100d]/88 p-6',
  iconSize = 28,
  iconClassName = 'mb-8 text-[#f0c067]',
  titleClassName = 'text-xl font-black leading-tight text-white',
  bodyClassName = 'mt-4 text-sm leading-relaxed text-[#b9b2a6]',
  headingLevel: Heading = 'h3',
  as: Tag = 'article',
}: IconFeatureCardProps) {
  return (
    <HoverLift>
      <Tag className={cn(className, "transition-colors duration-300 hover:bg-white/5 h-full")}>
        <Icon aria-hidden="true" className={iconClassName} size={iconSize} strokeWidth={1.5} />
        <Heading className={titleClassName}>{title}</Heading>
        <p className={bodyClassName}>{body}</p>
      </Tag>
    </HoverLift>
  );
}
