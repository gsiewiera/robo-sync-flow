import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Address {
  id: string;
  client_id: string;
  address_type: string;
  label: string | null;
  address: string;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  is_primary: boolean;
  notes: string | null;
}

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  address?: Address | null;
  onSuccess: () => void;
}

const ADDRESS_TYPES = ["office", "warehouse", "billing", "shipping", "headquarters", "branch"];

export const AddressFormDialog = ({
  open,
  onOpenChange,
  clientId,
  address,
  onSuccess,
}: AddressFormDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address_type: "office",
    label: "",
    address: "",
    city: "",
    postal_code: "",
    country: "Poland",
    is_primary: false,
    notes: "",
  });

  useEffect(() => {
    if (address) {
      setFormData({
        address_type: address.address_type || "office",
        label: address.label || "",
        address: address.address || "",
        city: address.city || "",
        postal_code: address.postal_code || "",
        country: address.country || "Poland",
        is_primary: address.is_primary || false,
        notes: address.notes || "",
      });
    } else {
      setFormData({
        address_type: "office",
        label: "",
        address: "",
        city: "",
        postal_code: "",
        country: "Poland",
        is_primary: false,
        notes: "",
      });
    }
  }, [address, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address.trim()) {
      toast({ title: "Address is required", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // If setting as primary, unset other primary addresses
      if (formData.is_primary) {
        await supabase
          .from("client_addresses")
          .update({ is_primary: false })
          .eq("client_id", clientId);
      }

      if (address) {
        const { error } = await supabase
          .from("client_addresses")
          .update({
            ...formData,
            label: formData.label || null,
            notes: formData.notes || null,
          })
          .eq("id", address.id);

        if (error) throw error;
        toast({ title: "Address updated successfully" });
      } else {
        const { error } = await supabase
          .from("client_addresses")
          .insert({
            client_id: clientId,
            ...formData,
            label: formData.label || null,
            notes: formData.notes || null,
          });

        if (error) throw error;
        toast({ title: "Address added successfully" });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error saving address", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{address ? "Edit Address" : "Add Address"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.address_type}
                onValueChange={(value) => setFormData({ ...formData, address_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDRESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label (optional)</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. Main Office"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address *</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="00-000"
              />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Country"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_primary}
              onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
            />
            <Label>Primary Address</Label>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : address ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
