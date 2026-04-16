import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#09140e] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-[#2f7245] bg-gradient-to-br from-[#245734] to-[#173524] text-primary-foreground hover:brightness-110",
        destructive:
          "border border-red-400/50 bg-gradient-to-br from-red-600 to-red-700 text-white hover:brightness-110",
        outline:
          "border border-[#3d5745] bg-[rgba(14,24,17,0.72)] text-[#d8e9dd] hover:border-[#5c7f67] hover:bg-[rgba(24,38,29,0.8)]",
        secondary:
          "border border-[#3a5542] bg-[rgba(25,41,31,0.92)] text-[#e8f5ea] hover:brightness-110",
        ghost:
          "text-[#d0e1d5] hover:bg-[rgba(35,56,41,0.72)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
