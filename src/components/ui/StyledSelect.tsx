import { SelectHTMLAttributes, forwardRef, Children, isValidElement, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StyledSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  icon?: LucideIcon;
}

const EMPTY_VALUE = '__empty__';

const StyledSelect = forwardRef<HTMLSelectElement, StyledSelectProps>(
  ({ icon: Icon, className, children, onChange, value, name, ...props }, ref) => {
    const options = Children.toArray(children)
      .map((child) => {
        if (!isValidElement(child) || child.type !== 'option') return null;
        const rawValue = child.props.value;
        const label =
          typeof child.props.children === 'string'
            ? child.props.children
            : String(child.props.children ?? '');
        const mappedValue = rawValue === '' ? EMPTY_VALUE : String(rawValue);
        return { value: mappedValue, rawValue: rawValue ?? '', label };
      })
      .filter(Boolean) as Array<{ value: string; rawValue: string; label: string }>;

    const emptyOption = options.find((o) => o.rawValue === '');
    const currentValue = value === '' || value == null ? undefined : String(value);

    const handleValueChange = (next: string) => {
      const normalized = next === EMPTY_VALUE ? '' : next;
      onChange?.({
        target: { value: normalized, name: name ?? '' },
      } as ChangeEvent<HTMLSelectElement>);
    };

    return (
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none z-10" />
        )}
        <Select value={currentValue} onValueChange={handleValueChange} disabled={props.disabled}>
          <SelectTrigger
            className={cn(
              'w-full h-12 rounded-xl border border-border bg-background text-sm text-foreground',
              'focus:ring-2 focus:ring-ring focus:border-primary',
              'transition-all hover:border-primary/40',
              Icon ? 'pl-10 pr-10' : 'pl-4 pr-10',
              className,
            )}
          >
            <SelectValue placeholder={emptyOption?.label} />
          </SelectTrigger>
          <SelectContent side="bottom" avoidCollisions={false} className="max-h-72">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name={name} value={value ?? ''} />
      </div>
    );
  }
);

StyledSelect.displayName = 'StyledSelect';
export default StyledSelect;
