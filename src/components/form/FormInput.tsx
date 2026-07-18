import { getInputProps, type FieldMetadata } from "@conform-to/react";
import { Input } from "@/components/ui/input";
import ErrorMessage from "./ErrorMessage";
import { Textarea } from "@/components/ui/textarea";

interface FormInputProps {
  field: FieldMetadata<string | number>;

  label: string;

  type?:
    | "number"
    | "checkbox"
    | "color"
    | "date"
    | "datetime-local"
    | "email"
    | "file"
    | "hidden"
    | "month"
    | "password"
    | "radio"
    | "range"
    | "search"
    | "tel"
    | "text"
    | "time"
    | "url"
    | "week";
  required?: boolean;

  placeholder?: string;

  className?: string;

  textarea?: boolean;
  message?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function FormInput({
  field,
  label,
  type = "text",
  required = false,
  placeholder = "",
  className = "",
  textarea = false,
  message = "",
  onValueChange,
  disabled = false,
}: FormInputProps) {
  const hasError = (field.errors?.length ?? 0) > 0;
  const isRequired = required || field.required;

  // For textarea inputs
  if (textarea) {
    return (
      <div className="grid gap-2">
        <label htmlFor={field.id} className="text-xs font-semibold">
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <Textarea
          {...getInputProps(field, { type, ariaAttributes: false })}
          aria-invalid={hasError}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          onChange={(event) => onValueChange?.(event.target.value)}
        />
        <ErrorMessage message={field.errors} />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <label htmlFor={field.id} className="text-xs font-semibold mb-2">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </label>

      <Input
        {...getInputProps(field, { type, ariaAttributes: false })}
        aria-invalid={hasError}
        className={className}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value)}
      />
      {message && <p className="mt-2 text-xs text-gray-500">{message}</p>}

      <ErrorMessage message={field.errors} />
    </div>
  );
}
