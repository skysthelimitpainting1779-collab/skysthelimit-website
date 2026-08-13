interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}

export default function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: RangeSliderProps) {
  const minLabel = `${min}${suffix ? ` ${suffix}` : ''}`;
  const maxLabel = `${max}${suffix ? ` ${suffix}` : ''}`;
  const displayValue = `${value}${suffix ? ` ${suffix}` : ''}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-xs font-bold">
        <label htmlFor={id} className="text-[var(--muted-foreground)]">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-[var(--foreground)]">
          {displayValue}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={displayValue}
        aria-describedby={`${id}-bounds`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-ew-resize accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--background)]"
      />
      <div
        id={`${id}-bounds`}
        className="flex justify-between font-mono text-xs text-[var(--muted-foreground)]"
      >
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
