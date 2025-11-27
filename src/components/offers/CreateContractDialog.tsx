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

interface CreateContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: string;
  clientId: string;
  offerData: any;
  offerItems: any[];
  resellerId?: string;
}

export function CreateContractDialog({
  open,
  onOpenChange,
  offerId,
  clientId,
  offerData,
  offerItems,
  resellerId,
}: CreateContractDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [contractNumber, setContractNumber] = useState("");
  const [status, setStatus] = useState<"draft" | "pending_signature" | "active" | "expired" | "cancelled">("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [paymentModel, setPaymentModel] = useState("");
  const [billingSchedule, setBillingSchedule] = useState("");
  const [terms, setTerms] = useState("");
  const [totalPurchaseValue, setTotalPurchaseValue] = useState("");
  const [totalMonthlyContracted, setTotalMonthlyContracted] = useState("");
  const [warrantyCost, setWarrantyCost] = useState("");
  const [implementationCost, setImplementationCost] = useState("");
  const [otherServicesCost, setOtherServicesCost] = useState("");
  const [otherServicesDescription, setOtherServicesDescription] = useState("");

  useEffect(() => {
    if (open && offerItems.length > 0) {
      // Auto-fill contract data from offer
      const leaseItems = offerItems.filter(item => item.contract_type === "lease");
      
      if (leaseItems.length > 0) {
        // Calculate monthly payment for lease
        const totalPrice = leaseItems.reduce((sum, item) => 
          sum + (item.quantity * item.unit_price), 0
        );
        const leaseMonths = leaseItems[0].lease_months || 12;
        const monthlyAmount = totalPrice / leaseMonths;
        
        setMonthlyPayment(monthlyAmount.toFixed(2));
        setPaymentModel("lease");
        
        // Set end date based on lease months
        if (startDate) {
          const start = new Date(startDate);
          start.setMonth(start.getMonth() + leaseMonths);
          setEndDate(start.toISOString().split('T')[0]);
        }
        
        // Fetch billing schedule from settings
        fetchLeaseSettings();
      } else {
        setPaymentModel("purchase");
        setMonthlyPayment("0");
      }
      
      // Generate contract number
      generateContractNumber();
    }
  }, [open, offerItems, startDate]);

  const fetchLeaseSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "lease_billing_schedule")
      .maybeSingle();
    
    if (data?.value) {
      setBillingSchedule(data.value);
    } else {
      setBillingSchedule("monthly");
    }
  };

  const generateContractNumber = async () => {
    const { data } = await supabase
      .from("contracts")
      .select("contract_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.contract_number) {
      const match = data.contract_number.match(/\d+$/);
      if (match) {
        const nextNumber = parseInt(match[0]) + 1;
        setContractNumber(`CON-${String(nextNumber).padStart(5, "0")}`);
      }
    } else {
      setContractNumber("CON-00001");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      
      // Create contract
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .insert([{
          contract_number: contractNumber,
          client_id: clientId,
          reseller_id: resellerId || null,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          monthly_payment: parseFloat(monthlyPayment),
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
      
      const contract = contractData as any;

      if (contractError) throw contractError;

      // Link robots from offer to contract
      const robotIds = offerItems.map(item => item.robot_id).filter(Boolean);
      if (robotIds.length > 0) {
        const { error: robotsError } = await supabase
          .from("contract_robots")
          .insert(
            robotIds.map(robotId => ({
              contract_id: contract.id,
              robot_id: robotId,
            }))
          );

        if (robotsError) throw robotsError;
      }

      toast({
        title: "Success",
        description: "Contract created successfully",
      });

      onOpenChange(false);
      navigate(`/contracts/${contract.id}`);
    } catch (error) {
      console.error("Error creating contract:", error);
      toast({
        title: "Error",
        description: "Failed to create contract",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contract from Offer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contractNumber">Contract Number</Label>
              <Input
                id="contractNumber"
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_signature">Pending Signature</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
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
              <Label htmlFor="paymentModel">Payment Model</Label>
              <Select value={paymentModel} onValueChange={setPaymentModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="monthlyPayment">Monthly Payment</Label>
              <Input
                id="monthlyPayment"
                type="number"
                step="0.01"
                value={monthlyPayment}
                onChange={(e) => setMonthlyPayment(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="billingSchedule">Billing Schedule</Label>
            <Input
              id="billingSchedule"
              value={billingSchedule}
              onChange={(e) => setBillingSchedule(e.target.value)}
              placeholder="e.g., monthly, quarterly"
            />
          </div>

          <div>
            <Label htmlFor="terms">Contract Terms</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={4}
              placeholder="Enter contract terms and conditions"
            />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Financial Summary</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalPurchaseValue">Total Purchase Value</Label>
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
                <Label htmlFor="totalMonthlyContracted">Total Monthly Contracted</Label>
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

            <h4 className="font-medium text-sm">Additional Services</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warrantyCost">Warranty Cost</Label>
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
                <Label htmlFor="implementationCost">Implementation Cost</Label>
                <Input
                  id="implementationCost"
                  type="number"
                  step="0.01"
                  value={implementationCost}
                  onChange={(e) => setImplementationCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="otherServicesCost">Other Services Cost</Label>
                <Input
                  id="otherServicesCost"
                  type="number"
                  step="0.01"
                  value={otherServicesCost}
                  onChange={(e) => setOtherServicesCost(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="otherServicesDescription">Other Services Description</Label>
                <Input
                  id="otherServicesDescription"
                  value={otherServicesDescription}
                  onChange={(e) => setOtherServicesDescription(e.target.value)}
                  placeholder="Describe other services"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Contract"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
