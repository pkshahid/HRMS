"use client";

import { SUPPORTED_CURRENCIES } from "@/lib/currency";

type Props = {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
};

/**
 * Reusable currency dropdown. Renders a native <select> styled with the
 * project's `input` class so it matches every other form field.
 */
export function CurrencySelect({ value, onChange, className, disabled, id }: Props) {
  return (
    <select
      id={id}
      className={className ?? "input"}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
