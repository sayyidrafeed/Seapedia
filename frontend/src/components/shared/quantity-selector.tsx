import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantitySelectorProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}

export function QuantitySelector({ value, min = 1, max, onChange }: QuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center border border-border rounded-lg bg-background w-fit overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDecrement}
        disabled={value <= min}
        className="h-9 w-9 rounded-none hover:bg-muted cursor-pointer"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center text-sm font-semibold select-none">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleIncrement}
        disabled={value >= max}
        className="h-9 w-9 rounded-none hover:bg-muted cursor-pointer"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
