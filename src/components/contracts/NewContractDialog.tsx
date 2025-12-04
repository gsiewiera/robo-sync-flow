import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { Plus, UserPlus, Trash2, Bot, Package } from "lucide-react";
import { SearchableSelectDropdown } from "@/components/ui/searchable-filter-dropdown";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { formatMoney } from "@/lib/utils";

interface RobotPricing {
  id: string;
  robot_model: string;
  sale_price_pln_net: number;
  sale_price_eur_net: number;
  sale_price_usd_net: number;
}

interface LeasePricing {
  id: string;
  robot_pricing_id: string;
  months: number;
  price_pln_net: number;
  price_eur_net: number;
  price_usd_net: number;
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  price_net: number;
  vat_rate: number;
}

interface ContractRobotItem {
  id: string;
  robotPricingId: string;
  model: string;
  quantity: number;
  contractType: 'purchase' | 'lease';
  unitPrice: number;
  leaseMonths?: number;
  monthlyPrice?: number;
}

interface ContractItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

interface NewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialClientId?: string;
}

export function NewContractDialog({ open, onOpenChange, onSuccess, initialClientId }: NewContractDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [showClientForm, setShowClientForm] = useState(false);
  
  // Pricing data
  const [robotPricing, setRobotPricing] = useState<RobotPricing[]>([]);
  const [leasePricing, setLeasePricing] = useState<LeasePricing[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [leaseMonthOptions, setLeaseMonthOptions] = useState<number[]>([]);
  const [contractStatuses, setContractStatuses] = useState<{ id: string; name: string }[]>([]);
  
  // Contract items
  const [contractRobots, setContractRobots] = useState<ContractRobotItem[]>([]);
  const [contractItems, setContractItems] = useState<ContractItem[]>([]);
  
  // Contract fields
  const [contractNumber, setContractNumber] = useState("");
  const [status, setStatus] = useState("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [billingSchedule, setBillingSchedule] = useState("monthly");
  const [currency, setCurrency] = useState("PLN");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchRobotPricing();
      fetchItems();
      fetchLeaseMonths();
      fetchContractStatuses();
      generateContractNumber();
      // Reset form
      setContractRobots([]);
      setContractItems([]);
      setSelectedClientId(initialClientId || "all");
      setCurrency("PLN");
      setStatus("draft");
    }
  }, [open, initialClientId]);

  const fetchContractStatuses = async () => {
    const { data } = await supabase
      .from("contract_status_dictionary")
      .select("id, name")
      .order("display_order");

    if (data) {
      setContractStatuses(data);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name").order("name");
    if (data) setClients(data);
  };

  const fetchRobotPricing = async () => {
    const { data } = await supabase.from("robot_pricing").select("*").order("robot_model");
    if (data) setRobotPricing(data);
    
    const { data: leaseData } = await supabase.from("lease_pricing").select("*");
    if (leaseData) setLeasePricing(leaseData);
  };

  const fetchItems = async () => {
    const { data } = await supabase.from("items").select("*").eq("is_active", true).order("name");
    if (data) setItems(data);
  };

  const fetchLeaseMonths = async () => {
    const { data } = await supabase.from("lease_month_dictionary").select("months").order("months");
    if (data) setLeaseMonthOptions(data.map(d => d.months));
  };

  const generateContractNumber = async () => {
    // Fetch the contract number mask from settings
    const { data: maskSetting } = await supabase
      .from("system_text_settings")
      .select("setting_value")
      .eq("setting_key", "contract_number_mask")
      .single();

    const mask = maskSetting?.setting_value || "CNT-{YYYY}-{NNN}";
    const currentYear = new Date().getFullYear();
    
    // Extract prefix pattern (everything before {NNN}) for searching existing contracts
    const prefixPattern = mask.replace("{YYYY}", String(currentYear)).replace("{NNN}", "");
    
    const { data: contracts } = await supabase
      .from("contracts")
      .select("contract_number")
      .like("contract_number", `${prefixPattern}%`);

    let maxNumber = 0;
    if (contracts && contracts.length > 0) {
      contracts.forEach(contract => {
        const match = contract.contract_number.match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1]);
          if (num > maxNumber) maxNumber = num;
        }
      });
    }
    
    // Generate new number using the mask
    const newNumber = String(maxNumber + 1).padStart(3, "0");
    const generatedNumber = mask
      .replace("{YYYY}", String(currentYear))
      .replace("{NNN}", newNumber);
    
    setContractNumber(generatedNumber);
  };

  const getPriceForCurrency = (pricing: RobotPricing) => {
    switch (currency) {
      case "EUR": return pricing.sale_price_eur_net;
      case "USD": return pricing.sale_price_usd_net;
      default: return pricing.sale_price_pln_net;
    }
  };

  const getLeasePriceForCurrency = (lease: LeasePricing) => {
    switch (currency) {
      case "EUR": return lease.price_eur_net;
      case "USD": return lease.price_usd_net;
      default: return lease.price_pln_net;
    }
  };

  const addRobot = () => {
    if (robotPricing.length === 0) return;
    
    const firstRobot = robotPricing[0];
    const price = getPriceForCurrency(firstRobot);
    
    setContractRobots([...contractRobots, {
      id: crypto.randomUUID(),
      robotPricingId: firstRobot.id,
      model: firstRobot.robot_model,
      quantity: 1,
      contractType: 'purchase',
      unitPrice: price,
      leaseMonths: leaseMonthOptions[0] || 12,
      monthlyPrice: price / (leaseMonthOptions[0] || 12),
    }]);
  };

  const updateRobot = (id: string, updates: Partial<ContractRobotItem>) => {
    setContractRobots(robots => robots.map(r => {
      if (r.id !== id) return r;
      
      const updated = { ...r, ...updates };
      
      // If robot model changed, update prices
      if (updates.robotPricingId) {
        const pricing = robotPricing.find(p => p.id === updates.robotPricingId);
        if (pricing) {
          updated.model = pricing.robot_model;
          updated.unitPrice = getPriceForCurrency(pricing);
          
          if (updated.leaseMonths) {
            const lease = leasePricing.find(l => l.robot_pricing_id === pricing.id && l.months === updated.leaseMonths);
            updated.monthlyPrice = lease ? getLeasePriceForCurrency(lease) : updated.unitPrice / updated.leaseMonths;
          }
        }
      }
      
      // If lease months changed, update monthly price
      if (updates.leaseMonths) {
        const lease = leasePricing.find(l => l.robot_pricing_id === updated.robotPricingId && l.months === updates.leaseMonths);
        updated.monthlyPrice = lease ? getLeasePriceForCurrency(lease) : updated.unitPrice / updates.leaseMonths;
      }

      // If contract type changed to lease and no lease price set, calculate it
      if (updates.contractType === 'lease' && updated.leaseMonths) {
        const lease = leasePricing.find(l => l.robot_pricing_id === updated.robotPricingId && l.months === updated.leaseMonths);
        updated.monthlyPrice = lease ? getLeasePriceForCurrency(lease) : updated.unitPrice / updated.leaseMonths;
      }
      
      return updated;
    }));
  };

  const removeRobot = (id: string) => {
    setContractRobots(robots => robots.filter(r => r.id !== id));
  };

  const addItem = () => {
    if (items.length === 0) return;
    
    const firstItem = items[0];
    setContractItems([...contractItems, {
      id: crypto.randomUUID(),
      itemId: firstItem.id,
      name: firstItem.name,
      quantity: 1,
      unitPrice: firstItem.price_net,
      vatRate: firstItem.vat_rate,
    }]);
  };

  const updateItem = (id: string, updates: Partial<ContractItem>) => {
    setContractItems(prevItems => prevItems.map(item => {
      if (item.id !== id) return item;
      
      const updated = { ...item, ...updates };
      
      if (updates.itemId) {
        const itemData = items.find(i => i.id === updates.itemId);
        if (itemData) {
          updated.name = itemData.name;
          updated.unitPrice = itemData.price_net;
          updated.vatRate = itemData.vat_rate;
        }
      }
      
      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setContractItems(items => items.filter(i => i.id !== id));
  };

  // Calculate summary
  const summary = useMemo(() => {
    const purchaseRobots = contractRobots.filter(r => r.contractType === 'purchase');
    const leaseRobots = contractRobots.filter(r => r.contractType === 'lease');
    
    const robotsPurchaseTotal = purchaseRobots.reduce((sum, r) => sum + (r.quantity * r.unitPrice), 0);
    const robotsLeaseMonthlyTotal = leaseRobots.reduce((sum, r) => sum + (r.quantity * (r.monthlyPrice || 0)), 0);
    const itemsTotal = contractItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    
    const totalPurchaseValue = robotsPurchaseTotal + itemsTotal;
    const totalMonthly = robotsLeaseMonthlyTotal;
    
    return {
      robotsPurchaseTotal,
      robotsLeaseMonthlyTotal,
      itemsTotal,
      totalPurchaseValue,
      totalMonthly,
      hasPurchase: purchaseRobots.length > 0 || contractItems.length > 0,
      hasLease: leaseRobots.length > 0,
    };
  }, [contractRobots, contractItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedClientId === "all") {
      toast({ title: t("common.error"), description: t("contracts.selectClient"), variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      await generateContractNumber();
      
      // Determine payment model based on robots
      const hasLease = contractRobots.some(r => r.contractType === 'lease');
      const hasPurchase = contractRobots.some(r => r.contractType === 'purchase');
      const paymentModel = hasLease && hasPurchase ? 'mixed' : hasLease ? 'lease' : 'purchase';
      
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .insert([{
          contract_number: contractNumber,
          client_id: selectedClientId,
          status,
          start_date: startDate || null,
          end_date: endDate || null,
          monthly_payment: summary.totalMonthly,
          payment_model: paymentModel,
          billing_schedule: billingSchedule,
          terms,
          total_purchase_value: summary.totalPurchaseValue,
          total_monthly_contracted: summary.totalMonthly,
          other_services_cost: summary.itemsTotal,
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

      // Insert contract line items (robot pricing selections)
      if (contractRobots.length > 0) {
        const lineItems = contractRobots.map(robot => ({
          contract_id: contractData.id,
          robot_model: robot.model,
          contract_type: robot.contractType,
          quantity: robot.quantity,
          unit_price: robot.contractType === 'purchase' ? robot.unitPrice : 0,
          lease_months: robot.contractType === 'lease' ? robot.leaseMonths : null,
          monthly_price: robot.contractType === 'lease' ? robot.monthlyPrice : null,
        }));

        const { error: itemsError } = await supabase
          .from("contract_line_items")
          .insert(lineItems);

        if (itemsError) {
          console.error("Error inserting contract line items:", itemsError);
        }
      }

      toast({ title: t("common.success"), description: t("contracts.created") });
      onSuccess?.();
      onOpenChange(false);
      navigate(`/contracts/${contractData.id}`);
    } catch (error: any) {
      console.error("Error creating contract:", error);
      toast({ title: t("common.error"), description: error.message || t("contracts.createError"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("contracts.newContract")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                <Button type="button" variant="outline" onClick={() => setShowClientForm(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("clients.newClient")}
                </Button>
              </div>
            </div>

            {/* Contract Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("contracts.contractNumber")}</Label>
                <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} required />
              </div>
              <div>
                <Label>{t("common.status")}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractStatuses.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {t(`status.${s.name}`, s.name.replace(/_/g, ' '))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>{t("contracts.startDate")}</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>{t("contracts.endDate")}</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <Label>{t("contracts.billingSchedule")}</Label>
                <Input value={billingSchedule} onChange={(e) => setBillingSchedule(e.target.value)} />
              </div>
            </div>

            <Separator />

            {/* Robots Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  {t("contracts.robots")}
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addRobot}>
                  <Plus className="h-4 w-4 mr-1" /> {t("contracts.addRobot")}
                </Button>
              </div>
              
              {contractRobots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("contracts.noRobotsAdded")}</p>
              ) : (
                <div className="space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_100px_60px_80px_180px_100px_32px] gap-2 px-2 text-xs font-medium text-muted-foreground">
                    <span>{t("robots.model")}</span>
                    <span>{t("contracts.type")}</span>
                    <span>{t("contracts.qty")}</span>
                    <span>{t("contracts.lease")}</span>
                    <span>{t("contracts.price")}</span>
                    <span className="text-right">{t("common.total")}</span>
                    <span></span>
                  </div>
                  {contractRobots.map((robot) => (
                    <div key={robot.id} className="grid grid-cols-[1fr_100px_60px_80px_180px_100px_32px] gap-2 items-center bg-muted/30 rounded-md p-2">
                      {/* Model */}
                      <Select value={robot.robotPricingId} onValueChange={(v) => updateRobot(robot.id, { robotPricingId: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {robotPricing.map(rp => (
                            <SelectItem key={rp.id} value={rp.id}>{rp.robot_model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Contract Type */}
                      <Select value={robot.contractType} onValueChange={(v) => updateRobot(robot.id, { contractType: v as 'purchase' | 'lease' })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="purchase">{t("contracts.purchase")}</SelectItem>
                          <SelectItem value="lease">{t("contracts.lease")}</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Quantity */}
                      <Input 
                        type="number" 
                        min="1" 
                        value={robot.quantity} 
                        onChange={(e) => updateRobot(robot.id, { quantity: parseInt(e.target.value) || 1 })}
                        className="h-9 text-center px-1"
                      />
                      {/* Lease months - hidden when Purchase */}
                      {robot.contractType === "lease" ? (
                        <Select 
                          value={String(robot.leaseMonths || "")} 
                          onValueChange={(v) => updateRobot(robot.id, { leaseMonths: parseInt(v) })}
                        >
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {leaseMonthOptions.map(m => (
                              <SelectItem key={m} value={String(m)}>{m}m</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span></span>
                      )}
                      {/* Price with currency */}
                      <div className="flex gap-1 items-center">
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={robot.contractType === "purchase" ? robot.unitPrice : (robot.monthlyPrice || 0)} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (robot.contractType === "purchase") {
                              updateRobot(robot.id, { unitPrice: val });
                            } else {
                              updateRobot(robot.id, { monthlyPrice: val });
                            }
                          }}
                          className="h-9 px-2 flex-1"
                        />
                        <span className="text-xs text-muted-foreground shrink-0">{currency}{robot.contractType === "lease" ? "/m" : ""}</span>
                      </div>
                      {/* Total */}
                      <span className="text-right text-sm font-medium">
                        {robot.contractType === "purchase" 
                          ? formatMoney(robot.quantity * robot.unitPrice)
                          : formatMoney(robot.quantity * (robot.monthlyPrice || 0))
                        }
                      </span>
                      {/* Delete */}
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRobot(robot.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t("contracts.additionalItems")}
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> {t("contracts.addItem")}
                </Button>
              </div>
              
              {contractItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("contracts.noItemsAdded")}</p>
              ) : (
                <div className="space-y-3">
                  {contractItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                        <div className="col-span-2">
                          <Label>{t("items.title")}</Label>
                          <Select value={item.itemId} onValueChange={(v) => {
                            const itemData = items.find(i => i.id === v);
                            if (itemData) {
                              setContractItems(prev => prev.map(ci => 
                                ci.id === item.id ? { ...ci, itemId: v, name: itemData.name, unitPrice: itemData.price_net, vatRate: itemData.vat_rate } : ci
                              ));
                            }
                          }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {items.map(i => (
                                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{t("common.quantity")}</Label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={(e) => setContractItems(prev => prev.map(ci => 
                              ci.id === item.id ? { ...ci, quantity: parseInt(e.target.value) || 1 } : ci
                            ))} 
                          />
                        </div>
                        <div>
                          <Label>{t("contracts.unitPrice")}</Label>
                          <Input 
                            type="number" 
                            step="0.01" 
                            value={item.unitPrice} 
                            onChange={(e) => setContractItems(prev => prev.map(ci => 
                              ci.id === item.id ? { ...ci, unitPrice: parseFloat(e.target.value) || 0 } : ci
                            ))} 
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-right text-sm text-muted-foreground">
                        {t("common.total")}: {formatMoney(item.quantity * item.unitPrice)} {currency}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-4">{t("contracts.financialSummary")}</h3>
              <div className="space-y-2">
                {summary.hasPurchase && (
                  <>
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t("contracts.purchaseSection")}</div>
                    {summary.robotsPurchaseTotal > 0 && (
                      <div className="flex justify-between">
                        <span>{t("contracts.robotsPurchase")}:</span>
                        <span className="font-medium">{formatMoney(summary.robotsPurchaseTotal)} {currency}</span>
                      </div>
                    )}
                    {summary.itemsTotal > 0 && (
                      <div className="flex justify-between">
                        <span>{t("contracts.additionalItems")}:</span>
                        <span className="font-medium">{formatMoney(summary.itemsTotal)} {currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>{t("contracts.totalPurchaseValue")}:</span>
                      <span className="text-primary">{formatMoney(summary.totalPurchaseValue)} {currency}</span>
                    </div>
                  </>
                )}
                
                {summary.hasLease && (
                  <>
                    {summary.hasPurchase && <Separator className="my-3" />}
                    <div className="text-sm font-medium text-muted-foreground mb-2">{t("contracts.leaseSection")}</div>
                    <div className="flex justify-between">
                      <span>{t("contracts.robotsLease")}:</span>
                      <span className="font-medium">{formatMoney(summary.robotsLeaseMonthlyTotal)} {currency}/{t("contracts.month")}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>{t("contracts.monthlyPayment")}:</span>
                      <span className="text-primary">{formatMoney(summary.totalMonthly)} {currency}/{t("contracts.month")}</span>
                    </div>
                  </>
                )}
                
                {!summary.hasPurchase && !summary.hasLease && (
                  <p className="text-sm text-muted-foreground text-center">{t("contracts.noItemsForSummary")}</p>
                )}
              </div>
            </Card>

            {/* Terms */}
            <div>
              <Label>{t("contracts.terms")}</Label>
              <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} placeholder={t("contracts.termsPlaceholder")} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("common.creating") : t("contracts.createContract")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ClientFormDialog open={showClientForm} onOpenChange={setShowClientForm} onSuccess={() => { fetchClients(); setShowClientForm(false); }} />
    </>
  );
}
