import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Mail, Phone, MapPin, FileText, ShoppingCart, Bot, 
  Globe, Edit, DollarSign, Receipt, CreditCard, CheckSquare, Calendar,
  Users, Plus, Trash2, Pencil, Upload, File, Download, FolderOpen, User, MapPinned,
  StickyNote
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { ContactFormDialog } from "@/components/clients/ContactFormDialog";
import { AddressFormDialog } from "@/components/clients/AddressFormDialog";
import { AddressMap } from "@/components/clients/AddressMap";
import { NoteFormSheet } from "@/components/notes/NoteFormSheet";
import { TaskFormSheet } from "@/components/tasks/TaskFormSheet";
import { NewOfferDialog } from "@/components/offers/NewOfferDialog";
import { NewContractDialog } from "@/components/contracts/NewContractDialog";
import { formatMoney } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Client {
  id: string;
  name: string;
  nip: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  general_email: string | null;
  general_phone: string | null;
  website_url: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  billing_person_name: string | null;
  billing_person_email: string | null;
  billing_person_phone: string | null;
  balance: number | null;
  status: string | null;
  reseller_id: string | null;
  assigned_salesperson_id: string | null;
  client_type: string | null;
  market: string | null;
  segment: string | null;
}

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  monthly_payment: number | null;
  start_date: string | null;
}

interface Offer {
  id: string;
  offer_number: string;
  stage: string;
  total_price: number | null;
  created_at: string;
}

interface Robot {
  id: string;
  serial_number: string;
  model: string;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount_net: number;
  amount_gross: number;
  currency: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  status: string;
}

interface Payment {
  id: string;
  payment_number: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  meeting_date_time: string | null;
  meeting_type: string | null;
  assigned_to: string | null;
  profiles?: { full_name: string } | null;
}

interface Note {
  id: string;
  client_id: string | null;
  offer_id: string | null;
  note_date: string;
  contact_type: string;
  contact_person: string | null;
  note: string | null;
  key_points: string | null;
  needs: string | null;
  commitments_us: string | null;
  commitments_client: string | null;
  risks: string | null;
  next_step: string | null;
  priority: string;
  salesperson_id: string | null;
  profiles?: { full_name: string } | null;
}

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  notes: string | null;
  is_primary: boolean;
}

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

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
  notes: string | null;
  category: string | null;
  uploader_name?: string;
}

const DEFAULT_ROLES = ["contact", "billing", "technical", "decision maker", "manager"];

const statusColors: Record<string, string> = {
  // Contract/Offer statuses
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-warning text-warning-foreground",
  active: "bg-success text-success-foreground",
  sent: "bg-primary text-primary-foreground",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
  in_warehouse: "bg-muted text-muted-foreground",
  delivered: "bg-success text-success-foreground",
  // Client statuses
  inactive: "bg-muted text-muted-foreground",
  blocked: "bg-destructive text-destructive-foreground",
  // Invoice statuses
  pending: "bg-warning text-warning-foreground",
  paid: "bg-success text-success-foreground",
  overdue: "bg-destructive text-destructive-foreground",
  cancelled: "bg-muted text-muted-foreground",
  // Funnel stages
  leads: "bg-gray-500",
  qualified: "bg-blue-500",
  proposal_sent: "bg-yellow-500",
  negotiation: "bg-orange-500",
  closed_won: "bg-green-500",
  closed_lost: "bg-red-500",
};

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [clientTags, setClientTags] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [reseller, setReseller] = useState<{ id: string; name: string } | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [roleOptions, setRoleOptions] = useState<string[]>(DEFAULT_ROLES);
  const [salesperson, setSalesperson] = useState<{ id: string; full_name: string } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documentCategories, setDocumentCategories] = useState<string[]>([]);
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<string>("General");
  const [isDragging, setIsDragging] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [salespeople, setSalespeople] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    if (id) {
      fetchClientData();
      fetchDocumentCategories();
      checkAdminRole();
      fetchAddresses();
      fetchSalespeople();
    }
  }, [id]);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchSalespeople = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    if (data) {
      setSalespeople(data);
    }
  };

  const fetchDocumentCategories = async () => {
    const { data } = await supabase
      .from("document_category_dictionary")
      .select("name")
      .order("name");
    if (data) {
      setDocumentCategories(data.map(d => d.name));
    }
  };

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from("client_addresses")
      .select("*")
      .eq("client_id", id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });
    if (data) {
      setAddresses(data);
    }
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;
    
    const { error } = await supabase
      .from("client_addresses")
      .delete()
      .eq("id", addressToDelete.id);

    if (error) {
      toast({ title: "Error deleting address", variant: "destructive" });
    } else {
      toast({ title: "Address deleted" });
      fetchAddresses();
    }
    setAddressToDelete(null);
  };

  const fetchClientData = async () => {
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (clientData) {
      setClient(clientData);

      // Fetch reseller if present
      if (clientData.reseller_id) {
        const { data: resellerData } = await supabase
          .from("resellers")
          .select("id, name")
          .eq("id", clientData.reseller_id)
          .single();

        if (resellerData) {
          setReseller(resellerData);
        }
      }

      // Fetch salesperson if present
      if (clientData.assigned_salesperson_id) {
        const { data: salespersonData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", clientData.assigned_salesperson_id)
          .single();

        if (salespersonData) {
          setSalesperson(salespersonData);
        }
      } else {
        setSalesperson(null);
      }
    }

    // Fetch client tags
    const { data: tagsData } = await supabase
      .from("client_assigned_tags")
      .select("client_tags(*)")
      .eq("client_id", id);

    if (tagsData) {
      setClientTags(tagsData.map(t => t.client_tags).filter(Boolean));
    }

    const { data: contractsData } = await supabase
      .from("contracts")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (contractsData) {
      setContracts(contractsData);
    }

    const { data: offersData } = await supabase
      .from("offers")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (offersData) {
      setOffers(offersData);
    }

    const { data: robotsData } = await supabase
      .from("robots")
      .select("*")
      .eq("client_id", id);

    if (robotsData) {
      setRobots(robotsData);
    }

    // Fetch invoices
    const { data: invoicesData } = await supabase
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (invoicesData) {
      setInvoices(invoicesData);
    }

    // Fetch payments
    const { data: paymentsData } = await supabase
      .from("payments")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (paymentsData) {
      setPayments(paymentsData);
    }

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*, profiles(full_name)")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (tasksData) {
      setTasks(tasksData);
    }

    // Fetch notes
    const { data: notesData } = await supabase
      .from("notes")
      .select("*, profiles(full_name)")
      .eq("client_id", id)
      .order("note_date", { ascending: false });

    if (notesData) {
      setNotes(notesData);
    }

    // Fetch contacts
    const { data: contactsData } = await supabase
      .from("client_contacts")
      .select("*")
      .eq("client_id", id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (contactsData) {
      setContacts(contactsData);
      // Update role options with any custom roles
      const customRoles = contactsData
        .map(c => c.role)
        .filter(role => !DEFAULT_ROLES.includes(role));
      const uniqueRoles = [...new Set([...DEFAULT_ROLES, ...customRoles])];
      setRoleOptions(uniqueRoles);
    }

    // Fetch documents
    const { data: docsData } = await supabase
      .from("client_documents")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false });

    if (docsData) {
      // Fetch uploader names
      const uploaderIds = [...new Set(docsData.filter(d => d.uploaded_by).map(d => d.uploaded_by))];
      let uploaderMap: Record<string, string> = {};
      
      if (uploaderIds.length > 0) {
        const { data: uploaderData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", uploaderIds as string[]);
        
        if (uploaderData) {
          uploaderMap = Object.fromEntries(uploaderData.map(u => [u.id, u.full_name]));
        }
      }

      setDocuments(docsData.map(doc => ({
        ...doc,
        uploader_name: doc.uploaded_by ? uploaderMap[doc.uploaded_by] : undefined
      })));
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    
    try {
      const { error } = await supabase
        .from("client_contacts")
        .delete()
        .eq("id", contactToDelete.id);

      if (error) throw error;
      
      toast({ title: "Contact deleted successfully" });
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setContactToDelete(null);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsContactDialogOpen(true);
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setIsContactDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !id) return;

    setIsUploading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // Sanitize file name for storage (remove special characters, keep extension)
    const sanitizeFileName = (name: string) => {
      const ext = name.split('.').pop() || '';
      const baseName = name.replace(/\.[^/.]+$/, '');
      const sanitized = baseName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
        .replace(/_+/g, '_') // Remove multiple underscores
        .substring(0, 100); // Limit length
      return `${sanitized}.${ext}`;
    };

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const sanitizedName = sanitizeFileName(file.name);
        const fileName = `${id}/${Date.now()}-${sanitizedName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Save metadata to database
        const { error: dbError } = await supabase
          .from('client_documents')
          .insert({
            client_id: id,
            file_name: file.name,
            file_path: fileName,
            file_size: file.size,
            file_type: file.type || fileExt,
            uploaded_by: user?.id,
            category: selectedUploadCategory,
          });

        if (dbError) throw dbError;
      }

      toast({ title: "Files uploaded successfully" });
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      // Delete from storage
      await supabase.storage
        .from('client-documents')
        .remove([documentToDelete.file_path]);

      // Delete from database
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentToDelete.id);

      if (error) throw error;
      
      toast({ title: "Document deleted successfully" });
      fetchClientData();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDocumentToDelete(null);
    }
  };

  if (!client) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{client.name}</h1>
                {client.status && (
                  <Badge className={statusColors[client.status]}>
                    {client.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {client.balance !== null && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={`text-2xl font-bold ${client.balance < 0 ? 'text-destructive' : 'text-success'}`}>
                  {formatMoney(client.balance)} PLN
                </p>
              </div>
            )}
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>

        <Card className="p-6">
          {/* Tags */}
          {clientTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {clientTags.map((tag: any) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color }}
                  className="text-white"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Classification Badges Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Client Type</p>
              <p className="font-semibold text-sm">{client.client_type || <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
            </div>
            <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Market</p>
              <p className="font-semibold text-sm">{client.market || <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
            </div>
            <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Segment</p>
              <p className="font-semibold text-sm">{client.segment || <span className="text-muted-foreground italic font-normal">Not set</span>}</p>
            </div>
            {client.nip && (
              <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">NIP</p>
                <p className="font-semibold text-sm font-mono">{client.nip}</p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Contact Section */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{client.general_email || <span className="text-muted-foreground italic">Not set</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium text-sm">{client.general_phone || <span className="text-muted-foreground italic">Not set</span>}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Website</p>
                  {client.website_url ? (
                    <a 
                      href={client.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-sm text-primary hover:underline break-all"
                    >
                      {client.website_url}
                    </a>
                  ) : (
                    <p className="font-medium text-sm text-muted-foreground italic">Not set</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                {addresses.length > 0 ? (
                  <button
                    onClick={() => setIsMapDialogOpen(true)}
                    className="hover:text-primary transition-colors"
                    title="View on map"
                  >
                    <MapPinned className="w-4 h-4" />
                  </button>
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                Location
              </h3>
              <div className="space-y-1">
                {(() => {
                  const primaryAddress = addresses.find(a => a.is_primary) || addresses[0];
                  if (primaryAddress) {
                    return (
                      <>
                        <p className="font-medium text-sm">{primaryAddress.address}</p>
                        <p className="font-medium text-sm">
                          {primaryAddress.postal_code} {primaryAddress.city}
                        </p>
                        <p className="font-medium text-sm">{primaryAddress.country}</p>
                        {primaryAddress.label && (
                          <Badge variant="outline" className="text-xs mt-1">{primaryAddress.label}</Badge>
                        )}
                      </>
                    );
                  } else if (client.address) {
                    return (
                      <>
                        <p className="font-medium text-sm">{client.address}</p>
                        <p className="font-medium text-sm">
                          {client.postal_code} {client.city}
                        </p>
                        <p className="font-medium text-sm">{client.country}</p>
                      </>
                    );
                  } else {
                    return <p className="text-muted-foreground italic text-sm">No address set</p>;
                  }
                })()}
              </div>
            </div>

            {/* Assignment Section */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Assignment
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Salesperson</p>
                  <p className="font-medium text-sm">{salesperson?.full_name || <span className="text-muted-foreground italic">Unassigned</span>}</p>
                </div>
                {reseller && (
                  <div>
                    <p className="text-xs text-muted-foreground">Reseller Partner</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-sm"
                      onClick={() => navigate(`/resellers/${reseller.id}`)}
                    >
                      {reseller.name}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="flex-wrap">
            <TabsTrigger value="notes">
              <StickyNote className="w-4 h-4 mr-2" />
              Notes ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <CheckSquare className="w-4 h-4 mr-2" />
              Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="offers">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Offers ({offers.length})
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="w-4 h-4 mr-2" />
              Contacts ({contacts.length})
            </TabsTrigger>
            <TabsTrigger value="robots">
              <Bot className="w-4 h-4 mr-2" />
              Robots ({robots.length})
            </TabsTrigger>
            <TabsTrigger value="contracts">
              <FileText className="w-4 h-4 mr-2" />
              Contracts ({contracts.length})
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Receipt className="w-4 h-4 mr-2" />
              Payments ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <FileText className="w-4 h-4 mr-2" />
              Tickets (0)
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FolderOpen className="w-4 h-4 mr-2" />
              Docs ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPinned className="w-4 h-4 mr-2" />
              Addresses ({addresses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingNote(null); setIsNoteFormOpen(true); }} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
            {notes.map((note) => (
              <Card
                key={note.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => { setEditingNote(note); setIsNoteFormOpen(true); }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        {new Date(note.note_date).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {note.contact_type.replace("_", " ")}
                      </Badge>
                      {note.priority !== "normal" && (
                        <Badge variant={note.priority === "high" ? "destructive" : "secondary"}>
                          {note.priority}
                        </Badge>
                      )}
                    </div>
                    {note.contact_person && (
                      <p className="text-sm text-muted-foreground">
                        Contact: {note.contact_person}
                      </p>
                    )}
                    {note.key_points && (
                      <p className="text-sm line-clamp-2">{note.key_points}</p>
                    )}
                  </div>
                  {note.profiles?.full_name && (
                    <span className="text-xs text-muted-foreground">
                      by {note.profiles.full_name}
                    </span>
                  )}
                </div>
              </Card>
            ))}
            {notes.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No notes found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsContractDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Contract
              </Button>
            </div>
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/contracts/${contract.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{contract.contract_number}</h3>
                      <Badge className={statusColors[contract.status]}>
                        {contract.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {contract.start_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Start: {new Date(contract.start_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {contract.monthly_payment && (
                    <p className="text-lg font-bold text-primary">
                      {formatMoney(contract.monthly_payment)} PLN/mo
                    </p>
                  )}
                </div>
              </Card>
            ))}
            {contracts.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No contracts found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsOfferDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Offer
              </Button>
            </div>
            {offers.map((offer) => (
              <Card
                key={offer.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/offers/${offer.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{offer.offer_number}</h3>
                      <Badge className={statusColors[offer.stage]}>
                        {offer.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Created: {new Date(offer.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {offer.total_price && (
                    <p className="text-lg font-bold text-accent">
                      {formatMoney(offer.total_price)} PLN
                    </p>
                  )}
                </div>
              </Card>
            ))}
            {offers.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No offers found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddContact}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
            {contacts.map((contact) => (
              <Card key={contact.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{contact.full_name}</h3>
                      <Badge variant="secondary">
                        {contact.role.charAt(0).toUpperCase() + contact.role.slice(1)}
                      </Badge>
                      {contact.is_primary && (
                        <Badge variant="default" className="bg-primary">
                          Primary
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditContact(contact)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setContactToDelete(contact)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {contacts.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No contacts found. Add your first contact above.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Invoices Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Invoices
                </h3>
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold">{invoice.invoice_number}</h4>
                          <Badge className={statusColors[invoice.status]}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {formatMoney(invoice.amount_gross)} {invoice.currency}
                        </p>
                        {invoice.paid_date && (
                          <p className="text-xs text-muted-foreground">
                            Paid: {new Date(invoice.paid_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {invoices.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No invoices found</p>
                  </Card>
                )}
              </div>

              {/* Payments Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payments
                </h3>
                {payments.map((payment) => (
                  <Card key={payment.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{payment.payment_number}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </p>
                        {payment.payment_method && (
                          <p className="text-xs text-muted-foreground">
                            Method: {payment.payment_method}
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-success">
                        +{formatMoney(payment.amount)} {payment.currency}
                      </p>
                    </div>
                  </Card>
                ))}
                {payments.length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No payments found</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsTaskFormOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{task.title}</h3>
                      <Badge className={statusColors[task.status] || "bg-muted text-muted-foreground"}>
                        {task.status?.replace("_", " ")}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                      {task.meeting_date_time && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Meeting: {new Date(task.meeting_date_time).toLocaleString()}
                        </div>
                      )}
                      {task.profiles?.full_name && (
                        <span>Assigned to: {task.profiles.full_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {tasks.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No tasks found for this client</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Support tickets integration coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="robots" className="space-y-4">
            {robots.map((robot) => (
              <Card
                key={robot.id}
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/robots/${robot.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{robot.serial_number}</h3>
                      <Badge className={statusColors[robot.status]}>
                        {robot.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{robot.model}</p>
                  </div>
                </div>
              </Card>
            ))}
            {robots.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No robots found</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const input = document.getElementById('file-upload') as HTMLInputElement;
                  if (input) {
                    const dt = new DataTransfer();
                    Array.from(files).forEach(f => dt.items.add(f));
                    input.files = dt.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }
              }}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">
                Drag & drop files here, or click to select
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                <label className="text-sm text-muted-foreground">Category:</label>
                <select
                  value={selectedUploadCategory}
                  onChange={(e) => setSelectedUploadCategory(e.target.value)}
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {documentCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <label htmlFor="file-upload">
                <Button asChild disabled={isUploading}>
                  <span>
                    {isUploading ? "Uploading..." : "Select Files"}
                  </span>
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
            </div>
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <File className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{doc.file_name}</h3>
                        {doc.category && (
                          <Badge variant="secondary" className="text-xs">
                            {doc.category}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>{doc.file_type}</span>
                        <span>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</span>
                        {doc.uploader_name && <span>by {doc.uploader_name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDocumentToDelete(doc)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {documents.length === 0 && (
              <Card className="p-8 text-center">
                <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload PDF, Word, Excel, images and other files
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="addresses" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingAddress(null); setIsAddressDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Addresses list - 1/3 width */}
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <Card key={address.id} className="p-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2 min-w-0 flex-1">
                          <div className="p-1.5 bg-muted rounded-lg shrink-0">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <h3 className="font-semibold text-sm truncate">
                                {address.label || address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}
                              </h3>
                              {address.is_primary && (
                                <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs truncate">{address.address}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {address.postal_code} {address.city}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingAddress(address); setIsAddressDialogOpen(true); }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setAddressToDelete(address)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                {/* Map - 2/3 width */}
                <div className="lg:col-span-2">
                  <AddressMap addresses={addresses} />
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MapPinned className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No addresses added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add office, warehouse, or shipping addresses
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ClientFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchClientData}
        client={client}
      />

      <ContactFormDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        onSuccess={fetchClientData}
        clientId={id!}
        contact={editingContact}
        roleOptions={roleOptions}
      />

      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {contactToDelete?.full_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContact} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!documentToDelete} onOpenChange={() => setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.file_name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddressFormDialog
        open={isAddressDialogOpen}
        onOpenChange={setIsAddressDialogOpen}
        clientId={id!}
        address={editingAddress}
        onSuccess={fetchAddresses}
      />

      <AlertDialog open={!!addressToDelete} onOpenChange={() => setAddressToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <div className="h-[500px]">
            <AddressMap addresses={addresses} />
          </div>
        </DialogContent>
      </Dialog>

      {client && (
        <NoteFormSheet
          open={isNoteFormOpen}
          onOpenChange={(open) => {
            setIsNoteFormOpen(open);
            if (!open) setEditingNote(null);
          }}
          note={editingNote}
          onSuccess={() => {
            fetchClientData();
            setIsNoteFormOpen(false);
            setEditingNote(null);
          }}
          clients={[{ id: client.id, name: client.name }]}
          salespeople={salespeople}
          initialClientId={client.id}
        />
      )}

      {client && (
        <TaskFormSheet
          open={isTaskFormOpen}
          onOpenChange={setIsTaskFormOpen}
          onSuccess={() => {
            fetchClientData();
            setIsTaskFormOpen(false);
          }}
          initialValues={{ client_id: client.id }}
        />
      )}

      {client && (
        <NewOfferDialog
          open={isOfferDialogOpen}
          onOpenChange={setIsOfferDialogOpen}
          onSuccess={() => {
            fetchClientData();
            setIsOfferDialogOpen(false);
          }}
          initialClientId={client.id}
        />
      )}

      {client && (
        <NewContractDialog
          open={isContractDialogOpen}
          onOpenChange={setIsContractDialogOpen}
          onSuccess={() => {
            fetchClientData();
            setIsContractDialogOpen(false);
          }}
          initialClientId={client.id}
        />
      )}
    </Layout>
  );
};

export default ClientDetail;
