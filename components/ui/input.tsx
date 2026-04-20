import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-label-md text-on-surface-variant">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline transition-all focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none ${error ? "ring-2 ring-error/20 bg-error-container/10" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-error text-sm">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-label-md text-on-surface-variant">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={`bg-surface-container-high border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline transition-all focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest focus:outline-none resize-y min-h-[120px] ${error ? "ring-2 ring-error/20 bg-error-container/10" : ""} ${className}`}
          {...props}
        />
        {error && <p className="text-error text-sm">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Input, Textarea };
