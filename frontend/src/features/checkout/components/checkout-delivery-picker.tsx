import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Truck, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { deliveryFeeOptions } from '../constants/delivery-options';
import type { DeliveryMethod } from '../constants/delivery-options';

interface CheckoutDeliveryPickerProps {
  value: DeliveryMethod;
  onChange: (method: DeliveryMethod) => void;
}

export function CheckoutDeliveryPicker({ value, onChange }: CheckoutDeliveryPickerProps) {
  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden hover:border-primary/20 transition duration-200">
      <div className="bg-muted/50 p-4 border-b border-border/80">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Delivery Method
          </h3>
        </div>
      </div>
      <CardContent className="p-6">
        <RadioGroup
          value={value}
          onValueChange={(val) => onChange(val as DeliveryMethod)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {deliveryFeeOptions.map((opt) => (
            <label
              key={opt.value}
              className={`relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                value === opt.value
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card'
              }`}
            >
              <RadioGroupItem value={opt.value} className="sr-only" />
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-foreground">{opt.label}</span>
                {value === opt.value && (
                  <span className="bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground mb-3">{opt.time}</span>
              <span className="font-extrabold text-sm text-foreground mt-auto">
                {formatCurrency(opt.price)}
              </span>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
