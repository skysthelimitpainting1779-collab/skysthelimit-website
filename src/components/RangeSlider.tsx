import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';

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
    <Field>
      <div className="flex items-center justify-between gap-4">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <output htmlFor={id} className="font-mono text-sm font-bold text-foreground">{displayValue}</output>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(nextValue) => onChange(Array.isArray(nextValue) ? nextValue[0] : nextValue)}
        aria-label={label}
      />
      <FieldDescription className="flex justify-between font-mono text-xs">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </FieldDescription>
    </Field>
  );
}
