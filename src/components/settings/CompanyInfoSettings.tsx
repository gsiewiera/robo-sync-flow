import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2, MapPin, Phone, Mail, Globe, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyAddress {
  id: string;
  address_type: string;
  label: string | null;
  address: string;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  is_primary: boolean | null;
  created_at: string;
  updated_at: string;
}

interface CompanyInfo {
  id: string;
  company_name: string | null;
  main_phone: string | null;
  main_email: string | null;
  website: string | null;
  nip: string | null;
  regon: string | null;
  krs: string | null;
  logo_path: string | null;
}

const ADDRESS_TYPES = [
  { value: 'headquarters', label: 'Headquarters' },
  { value: 'branch', label: 'Branch' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'office', label: 'Office' },
  { value: 'factory', label: 'Factory' },
  { value: 'showroom', label: 'Showroom' },
  { value: 'service_center', label: 'Service Center' },
];

export function CompanyInfoSettings() {
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CompanyAddress | null>(null);
  const [formData, setFormData] = useState({
    address_type: 'headquarters',
    label: '',
    address: '',
    postal_code: '',
    city: '',
    country: 'Poland',
    notes: '',
    is_primary: false,
  });
  const [saving, setSaving] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [infoForm, setInfoForm] = useState({
    company_name: '',
    main_phone: '',
    main_email: '',
    website: '',
    nip: '',
    regon: '',
    krs: '',
  });

  useEffect(() => {
    checkAdminStatus();
    fetchAddresses();
    fetchCompanyInfo();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      setIsAdmin(roles?.some(r => r.role === 'admin') || false);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCompanyInfo(data);
        setInfoForm({
          company_name: data.company_name || '',
          main_phone: data.main_phone || '',
          main_email: data.main_email || '',
          website: data.website || '',
          nip: data.nip || '',
          regon: data.regon || '',
          krs: data.krs || '',
        });
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('company_addresses')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('address_type');

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching company addresses:', error);
      toast.error('Failed to load company addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompanyInfo = async () => {
    setSavingInfo(true);
    try {
      if (companyInfo) {
        const { error } = await supabase
          .from('company_info')
          .update({
            company_name: infoForm.company_name || null,
            main_phone: infoForm.main_phone || null,
            main_email: infoForm.main_email || null,
            website: infoForm.website || null,
            nip: infoForm.nip || null,
            regon: infoForm.regon || null,
            krs: infoForm.krs || null,
          })
          .eq('id', companyInfo.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('company_info')
          .insert({
            company_name: infoForm.company_name || null,
            main_phone: infoForm.main_phone || null,
            main_email: infoForm.main_email || null,
            website: infoForm.website || null,
            nip: infoForm.nip || null,
            regon: infoForm.regon || null,
            krs: infoForm.krs || null,
          })
          .select()
          .single();

        if (error) throw error;
        setCompanyInfo(data);
      }
      toast.success('Company information saved');
      fetchCompanyInfo();
    } catch (error) {
      console.error('Error saving company info:', error);
      toast.error('Failed to save company information');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (companyInfo?.logo_path) {
        await supabase.storage
          .from('company-logos')
          .remove([companyInfo.logo_path]);
      }

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create or update company info with logo path
      if (companyInfo) {
        const { error } = await supabase
          .from('company_info')
          .update({ logo_path: fileName })
          .eq('id', companyInfo.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('company_info')
          .insert({ logo_path: fileName })
          .select()
          .single();

        if (error) throw error;
        setCompanyInfo(data);
      }

      toast.success('Logo uploaded successfully');
      fetchCompanyInfo();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyInfo?.logo_path) return;

    try {
      await supabase.storage
        .from('company-logos')
        .remove([companyInfo.logo_path]);

      const { error } = await supabase
        .from('company_info')
        .update({ logo_path: null })
        .eq('id', companyInfo.id);

      if (error) throw error;

      toast.success('Logo removed');
      fetchCompanyInfo();
    } catch (error) {
      console.error('Error removing logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const getLogoUrl = () => {
    if (!companyInfo?.logo_path) return null;
    const { data } = supabase.storage
      .from('company-logos')
      .getPublicUrl(companyInfo.logo_path);
    return data.publicUrl;
  };

  const resetForm = () => {
    setFormData({
      address_type: 'headquarters',
      label: '',
      address: '',
      postal_code: '',
      city: '',
      country: 'Poland',
      notes: '',
      is_primary: false,
    });
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (address: CompanyAddress) => {
    setEditingAddress(address);
    setFormData({
      address_type: address.address_type,
      label: address.label || '',
      address: address.address,
      postal_code: address.postal_code || '',
      city: address.city || '',
      country: address.country || 'Poland',
      notes: address.notes || '',
      is_primary: address.is_primary || false,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.address.trim()) {
      toast.error('Address is required');
      return;
    }

    setSaving(true);
    try {
      if (formData.is_primary) {
        await supabase
          .from('company_addresses')
          .update({ is_primary: false })
          .neq('id', editingAddress?.id || '');
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('company_addresses')
          .update({
            address_type: formData.address_type,
            label: formData.label || null,
            address: formData.address,
            postal_code: formData.postal_code || null,
            city: formData.city || null,
            country: formData.country || null,
            notes: formData.notes || null,
            is_primary: formData.is_primary,
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success('Address updated successfully');
      } else {
        const { error } = await supabase
          .from('company_addresses')
          .insert({
            address_type: formData.address_type,
            label: formData.label || null,
            address: formData.address,
            postal_code: formData.postal_code || null,
            city: formData.city || null,
            country: formData.country || null,
            notes: formData.notes || null,
            is_primary: formData.is_primary,
          });

        if (error) throw error;
        toast.success('Address added successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const { error } = await supabase
        .from('company_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };

  const getAddressTypeLabel = (type: string) => {
    return ADDRESS_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const logoUrl = getLogoUrl();

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Basic company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-3">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="Company Logo"
                    className="h-24 w-24 object-contain border rounded-lg bg-background"
                  />
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                  <Building2 className="h-8 w-8" />
                </div>
              )}
              {isAdmin && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 5MB, PNG or JPG recommended
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Company Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={infoForm.company_name}
                onChange={(e) => setInfoForm({ ...infoForm, company_name: e.target.value })}
                placeholder="Company Name"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-1">
                <Globe className="h-3 w-3" /> Website
              </Label>
              <Input
                id="website"
                value={infoForm.website}
                onChange={(e) => setInfoForm({ ...infoForm, website: e.target.value })}
                placeholder="https://www.example.com"
                disabled={!isAdmin}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="main_phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> Main Phone
              </Label>
              <Input
                id="main_phone"
                value={infoForm.main_phone}
                onChange={(e) => setInfoForm({ ...infoForm, main_phone: e.target.value })}
                placeholder="+48 123 456 789"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> Main Email
              </Label>
              <Input
                id="main_email"
                type="email"
                value={infoForm.main_email}
                onChange={(e) => setInfoForm({ ...infoForm, main_email: e.target.value })}
                placeholder="contact@example.com"
                disabled={!isAdmin}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="nip">NIP</Label>
              <Input
                id="nip"
                value={infoForm.nip}
                onChange={(e) => setInfoForm({ ...infoForm, nip: e.target.value })}
                placeholder="0000000000"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regon">REGON</Label>
              <Input
                id="regon"
                value={infoForm.regon}
                onChange={(e) => setInfoForm({ ...infoForm, regon: e.target.value })}
                placeholder="000000000"
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="krs">KRS</Label>
              <Input
                id="krs"
                value={infoForm.krs}
                onChange={(e) => setInfoForm({ ...infoForm, krs: e.target.value })}
                placeholder="0000000000"
                disabled={!isAdmin}
              />
            </div>
          </div>

          {isAdmin && (
            <Button onClick={handleSaveCompanyInfo} disabled={savingInfo}>
              {savingInfo ? 'Saving...' : 'Save Company Information'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Company Addresses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Company Addresses
              </CardTitle>
              <CardDescription>
                Manage company locations such as headquarters, branches, and warehouses
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No company addresses defined yet.</p>
              {isAdmin && (
                <Button variant="outline" className="mt-4" onClick={openAddDialog}>
                  Add your first address
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {addresses.map((address) => (
                  <TableRow key={address.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {getAddressTypeLabel(address.address_type)}
                        </Badge>
                        {address.is_primary && (
                          <Badge variant="default">Primary</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{address.label || '-'}</TableCell>
                    <TableCell>
                      <div>
                        {address.address}
                        {address.postal_code && <span className="text-muted-foreground">, {address.postal_code}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{address.city || '-'}</TableCell>
                    <TableCell>{address.country || '-'}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(address)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(address.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Address Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? 'Edit Address' : 'Add Company Address'}
            </DialogTitle>
            <DialogDescription>
              {editingAddress ? 'Update the company address details.' : 'Add a new company location.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_type">Address Type</Label>
                <Select
                  value={formData.address_type}
                  onValueChange={(value) => setFormData({ ...formData, address_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Main Office"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="00-000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_primary"
                checked={formData.is_primary}
                onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
              />
              <Label htmlFor="is_primary">Set as primary address</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingAddress ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}