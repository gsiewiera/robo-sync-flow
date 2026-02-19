import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FormDialogWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  /** Max width class, e.g. "max-w-lg" or "max-w-4xl". Default: "max-w-2xl" */
  maxWidth?: string;
  /** Whether to wrap children in a ScrollArea. Default: true */
  scrollable?: boolean;
  description?: string;
}

export const FormDialogWrapper = ({
  open,
  onOpenChange,
  title,
  children,
  maxWidth = "max-w-2xl",
  scrollable = true,
  description,
}: FormDialogWrapperProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${maxWidth} max-h-[95vh] p-0 w-[95vw] sm:w-auto`}
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p id="dialog-description" className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </DialogHeader>
        {scrollable ? (
          <ScrollArea className="max-h-[calc(95vh-80px)] px-4 sm:px-6 pb-4 sm:pb-6">
            {children}
          </ScrollArea>
        ) : (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 overflow-y-auto max-h-[calc(95vh-80px)]">
            {children}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
