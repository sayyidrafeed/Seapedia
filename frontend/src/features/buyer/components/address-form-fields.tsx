import { useId } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FieldState {
  state: { value: string; meta: { errors?: unknown[] } };
  handleBlur: () => void;
  handleChange: (val: string) => void;
}

interface FormFieldProps {
  label: string;
  placeholder?: string;
  field: FieldState;
  isTextArea?: boolean;
}

export function FormField({ label, placeholder, field, isTextArea = false }: FormFieldProps) {
  const inputId = useId();
  const errorId = useId();
  const hasErrors = !!(field.state.meta.errors && field.state.meta.errors.length > 0);

  return (
    <div className="space-y-1">
      <label
        htmlFor={inputId}
        className="text-xs font-bold text-muted-foreground uppercase tracking-wider block"
      >
        {label}
      </label>
      {isTextArea ? (
        <Textarea
          id={inputId}
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? errorId : undefined}
        />
      ) : (
        <Input
          id={inputId}
          placeholder={placeholder}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? errorId : undefined}
        />
      )}
      {hasErrors && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert">
          {field.state.meta.errors!
            .map((err) =>
              typeof err === 'object' && err !== null && 'message' in err
                ? (err as { message: string }).message
                : String(err),
            )
            .join(', ')}
        </p>
      )}
    </div>
  );
}

interface LocationSelectProps {
  label: string;
  value: string;
  onValueChange: (val: string) => void;
  placeholder: string;
  loadingPlaceholder: string;
  errorPlaceholder: string;
  items?: { id: string; name: string }[];
  isLoading: boolean;
  isError: boolean;
  disabled: boolean;
  errors?: unknown[];
}

export function LocationSelect({
  label,
  value,
  onValueChange,
  placeholder,
  loadingPlaceholder,
  errorPlaceholder,
  items,
  isLoading,
  isError,
  disabled,
  errors,
}: LocationSelectProps) {
  const labelId = useId();
  const errorId = useId();
  const hasErrors = !!(errors && errors.length > 0);

  let activePlaceholder = placeholder;
  if (isLoading) activePlaceholder = loadingPlaceholder;
  if (isError) activePlaceholder = errorPlaceholder;

  return (
    <div className="space-y-1">
      <label
        id={labelId}
        className="text-xs font-bold text-muted-foreground uppercase tracking-wider block"
      >
        {label}
      </label>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading || isError}
      >
        <SelectTrigger
          className="w-full"
          aria-labelledby={labelId}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? errorId : undefined}
        >
          <SelectValue placeholder={activePlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {items?.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasErrors && (
        <p id={errorId} className="text-xs text-red-500 mt-1" role="alert">
          {errors!
            .map((err) =>
              typeof err === 'object' && err !== null && 'message' in err
                ? (err as { message: string }).message
                : String(err),
            )
            .join(', ')}
        </p>
      )}
    </div>
  );
}
