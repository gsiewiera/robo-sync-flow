import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  children?: ReactNode;
}

export const FormActions = ({
  onCancel,
  loading = false,
  submitLabel,
  cancelLabel,
  children,
}: FormActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
      {children}
      <Button type="button" variant="outline" onClick={onCancel}>
        {cancelLabel || t("common.cancel")}
      </Button>
      <Button type="submit" disabled={loading}>
        {loading
          ? t("common.saving", "Saving...")
          : submitLabel || t("common.save")}
      </Button>
    </div>
  );
};
