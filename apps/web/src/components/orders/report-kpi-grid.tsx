import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Calculator } from 'lucide-react';

interface ReportKpiGridProps {
  card1: {
    label: string;
    value: string | number;
    subtext: string;
  };
  card2: {
    label: string;
    value: string | number;
    subtext: string;
  };
  card3: {
    label: string;
    value: string | number;
    subtext: string;
  };
}

export function ReportKpiGrid({ card1, card2, card3 }: ReportKpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {/* Primary KPI Card */}
      <Card className="border border-border/80 shadow-sm relative overflow-hidden bg-gradient-to-br from-background to-primary/5 p-1 sm:p-0">
        <div className="absolute right-4 top-4 text-primary/10 hidden sm:block">
          <DollarSign className="h-12 w-12 lg:h-16 lg:w-16" />
        </div>
        <CardHeader className="pb-1 sm:pb-2">
          <CardDescription className="text-[10px] sm:text-xs uppercase tracking-wider font-bold">
            {card1.label}
          </CardDescription>
          <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
            {card1.value}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 sm:pb-6">
          <p className="text-[10px] sm:text-xs text-muted-foreground">{card1.subtext}</p>
        </CardContent>
      </Card>

      {/* Orders Card */}
      <Card className="border border-border/80 shadow-sm relative overflow-hidden p-1 sm:p-0">
        <div className="absolute right-4 top-4 text-muted-foreground/10 hidden sm:block">
          <ShoppingBag className="h-12 w-12 lg:h-16 lg:w-16" />
        </div>
        <CardHeader className="pb-1 sm:pb-2">
          <CardDescription className="text-[10px] sm:text-xs uppercase tracking-wider font-bold">
            {card2.label}
          </CardDescription>
          <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {card2.value}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 sm:pb-6">
          <p className="text-[10px] sm:text-xs text-muted-foreground">{card2.subtext}</p>
        </CardContent>
      </Card>

      {/* Avg Value Card */}
      <Card className="border border-border/80 shadow-sm relative overflow-hidden sm:col-span-2 lg:col-span-1 p-1 sm:p-0">
        <div className="absolute right-4 top-4 text-muted-foreground/10 hidden sm:block">
          <Calculator className="h-12 w-12 lg:h-16 lg:w-16" />
        </div>
        <CardHeader className="pb-1 sm:pb-2">
          <CardDescription className="text-[10px] sm:text-xs uppercase tracking-wider font-bold">
            {card3.label}
          </CardDescription>
          <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {card3.value}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 sm:pb-6">
          <p className="text-[10px] sm:text-xs text-muted-foreground">{card3.subtext}</p>
        </CardContent>
      </Card>
    </div>
  );
}
