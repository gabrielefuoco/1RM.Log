import * as React from "react"

import { cn } from "@/lib/utils"

// ── Variant styles ──────────────────────────────────────────────────
const variantStyles = {
    default: "bg-card border-border/50 shadow-sm card-hover-fx",
    elevated: "bg-card border-border/50 shadow-sm card-hover-fx",
    inset: "bg-muted/30 border-border/40",
} as const

type CardVariant = keyof typeof variantStyles

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant
    withOverlay?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", withOverlay, children, ...props }, ref) => {
        const showOverlay = withOverlay ?? (variant !== "inset")

        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-lg border text-card-foreground transition-all duration-200 relative overflow-hidden",
                    variantStyles[variant],
                    className
                )}
                {...props}
            >
                {/* Elevated: left accent bar */}
                {variant === "elevated" && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-border/40 group-hover:bg-primary/50 transition-colors duration-300" />
                )}
                {/* Overlay gradient on hover */}
                {showOverlay && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary/5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                )}
                {children}
            </div>
        )
    }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6 relative z-[1]", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight font-heading uppercase",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground font-sans", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0 relative z-[1]", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0 relative z-[1]", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export type { CardVariant }
