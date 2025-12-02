import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, UserPlus } from "lucide-react";
import { SearchableSelectDropdown } from "@/components/ui/searchable-filter-dropdown";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";

interface NewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function NewContractDialog({ open, onOpenChange, onSuccess }: NewContractDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [showClientForm, setShowClientForm] = useState(false);
  
  // Contract fields
  const [contractNumber, setContractNumber] = useState("");
  const [status, setStatus] = useState<"draft" | "pending_signature" | "active" | "expired" | "cancelled">("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("0");
  const [paymentModel, setPaymentModel] = useState("purchase");
  const [billingSchedule, setBillingSchedule] = useState("monthly");
  const [terms, setTerms] = useState("");
  const [totalPurchaseValue, setTotalPurchaseValue] = useState("");
  const [totalMonthlyContracted, setTotalMonthlyContracted] = useState("");
  const [warrantyCost, setWarrantyCost] = useState("");
  const [implementationCost, setImplementationCost] = useState("");
  const [otherServicesCost, setOtherServicesCost] = useState("");
  const [otherServicesDescription, setOtherServicesDescription] = useState("");

  useEffect(() => {
    if (open) {
      fetchClients();
      generateContractNumber();
    }
  }, [open]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");
    
    if (data) {
      setClients(data);
    }
  };

  const generateContractNumber = async () => {
    const currentYear = new Date().getFullYear();
    
    const { data: contracts } = await supabase
      .from("contracts")
      .select("contract_number")
      .like("contract_number", `CNT-${currentYear}-%`);

    let maxNumber = 0;
    if (contracts && contracts.length > 0) {
      contracts.forEach(contract => {
        const match = contract.contract_number.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
    }
    
    const nextNumber = maxNumber + 1;
    setContractNumber(`CNT-${currentYear}-${String(nextNumber).padStart(3, "0")}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedClientId === "all") {
      toast({
        title: t("common.error"),
        description: t("contracts.selectClient"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      // Regenerate contract number just before inserting
      await generateContractNumber();
      
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .insert([{
          contract_number: contractNumber,
          client_id: selectedClientId,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          monthly_payment: parseFloat(monthlyPayment) || 0,
          payment_model: paymentModel,
          billing_schedule: billingSchedule,
          terms,
          total_purchase_value: totalPurchaseValue ? parseFloat(totalPurchaseValue) : 0,
          total_monthly_contracted: totalMonthlyContracted ? parseFloat(totalMonthlyContracted) : 0,
          warranty_cost: warrantyCost ? parseFloat(warrantyCost) : 0,
          implementation_cost: implementationCost ? parseFloat(implementationCost) : 0,
          other_services_cost: otherServicesCost ? parseFloat(otherServicesCost) : 0,
          other_services_description: otherServicesDescription || null,
          created_by: session?.session?.user?.id,
        }])
        .select()
        .single();

      if (contractError) {
        if (contractError.message?.includes('duplicate key')) {
          throw new Error(t("contracts.duplicateNumber"));
        }
        throw contractError;
      }

      toast({
        title: t("common.success"),
        description: t("contracts.created"),
      });

      onSuccess?.();
      onOpenChange(false);
      navigate(`/contracts/${contractData.id}`);
    } catch (error: any) {
      console.error("Error creating contract:", error);
      toast({
        title: t("common.error"),
        description: error.message || t("contracts.createError"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientCreated = () => {
    fetchClients();
    setShowClientForm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("contracts.newContract")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>{t("contracts.client")} *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelectDropdown
                    options={clients.map(c => ({ id: c.id, label: c.name }))}
                    value={selectedClientId}
                    onChange={setSelectedClientId}
                    placeholder={t("contracts.selectClient")}
                    searchPlaceholder={t("common.search")}
                    allLabel={t("contracts.selectClient")}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClientForm(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("clients.newClient")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contractNumber">{t("contracts.contractNumber")}</Label>
                <Input
                  id="contractNumber"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">{t("common.status")}</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("status.draft")}</SelectItem>
                    <SelectItem value="pending_signature">{t("status.pending_signature")}</SelectItem>
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">{t("contracts.startDate")}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">{t("contracts.endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentModel">{t("contracts.paymentModel")}</Label>
                <Select value={paymentModel} onValueChange={setPaymentModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">{t("contracts.purchase")}</SelectItem>
                    <SelectItem value="lease">{t("contracts.lease")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="monthlyPayment">{t("contracts.monthlyPayment")}</Label>
                <Input
                  id="monthlyPayment"
                  type="number"
                  step="0.01"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="billingSchedule">{t("contracts.billingSchedule")}</Label>
              <Input
                id="billingSchedule"
                value={billingSchedule}
                onChange={(e) => setBillingSchedule(e.target.value)}
                placeholder="e.g., monthly, quarterly"
              />
            </div>

            <div>
              <Label htmlFor="terms">{t("contracts.terms")}</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder={t("contracts.termsPlaceholder")}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">{t("contracts.financialSummary")}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPurchaseValue">{t("contracts.totalPurchaseValue")}</Label>
                  <Input
                    id="totalPurchaseValue"
                    type="number"
                    step="0.01"
                    value={totalPurchaseValue}
                    onChange={(e) => setTotalPurchaseValue(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="totalMonthlyContracted">{t("contracts.totalMonthlyContracted")}</Label>
                  <Input
                    id="totalMonthlyContracted"
                    type="number"
                    step="0.01"
                    value={totalMonthlyContracted}
                    onChange={(e) => setTotalMonthlyContracted(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="warrantyCost">{t("contracts.warrantyCost")}</Label>
                  <Input
                    id="warrantyCost"
                    type="number"
                    step="0.01"
                    value={warrantyCost}
                    onChange={(e) => setWarrantyCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="implementationCost">{t("contracts.implementationCost")}</Label>
                  <Input
                    id="implementationCost"
                    type="number"
                    step="0.01"
                    value={implementationCost}
                    onChange={(e) => setImplementationCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="otherServicesCost">{t("contracts.otherServicesCost")}</Label>
                  <Input
                    id="otherServicesCost"
                    type="number"
                    step="0.01"
                    value={otherServicesCost}
                    onChange={(e) => setOtherServicesCost(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="otherServicesDescription">{t("contracts.otherServicesDescription")}</Label>
                <Input
                  id="otherServicesDescription"
                  value={otherServicesDescription}
                  onChange={(e) => setOtherServicesDescription(e.target.value)}
                  placeholder={t("contracts.otherServicesPlaceholder")}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("common.creating") : t("contracts.createContract")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ClientFormDialog
        open={showClientForm}
        onOpenChange={setShowClientForm}
        onSuccess={handleClientCreated}
      />
    </>
  );
}
