import * as React from "react";
import { cn } from "@/utils/shadcn/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rightIcon?: React.ReactNode; // Adding icon prop
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {rightIcon && <div className="absolute top-4 right-4">{rightIcon}</div>}
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-xl shadow-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
