import { cn } from "@/lib/utils";

interface ViewFieldProps {
  value: string | number | null | undefined;
  className?: string;
  multiline?: boolean;
}

/**
 * Read-only display for form fields in view mode.
 * Renders the value in a muted bordered container matching form input height.
 */
export const ViewField = ({ value, className, multiline = false }: ViewFieldProps) => (
  <div
    className={cn(
      "text-sm py-2 px-3 border rounded-md bg-muted",
      multiline && "min-h-[60px] whitespace-pre-wrap",
      className
    )}
  >
    {value || "-"}
  </div>
);
