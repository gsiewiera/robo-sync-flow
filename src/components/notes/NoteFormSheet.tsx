import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ClientCombobox } from "@/components/ui/client-combobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ListTodo, Plus } from "lucide-react";
import { TaskFormSheet } from "@/components/tasks/TaskFormSheet";
import { ContactFormDialog } from "@/components/clients/ContactFormDialog";

interface Note {
  id: string;
  client_id: string | null;
  contact_person: string | null;
  offer_id: string | null;
  note_date: string;
  salesperson_id: string | null;
  priority: string;
  contact_type: string;
  note: string | null;
  needs: string | null;
  key_points: string | null;
  commitments_us: string | null;
  commitments_client: string | null;
  risks: string | null;
  next_step: string | null;
}

interface Client {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

interface Offer {
  id: string;
  offer_number: string;
}

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

interface NoteFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSuccess: () => void;
  clients: Client[];
  salespeople: Profile[];
  initialClientId?: string;
}

export const NoteFormSheet = ({
  open,
  onOpenChange,
  note,
  onSuccess,
  clients,
  salespeople,
  initialClientId,
}: NoteFormSheetProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    contact_person: "",
    offer_id: "",
    note_date: new Date().toISOString().split("T")[0],
    salesperson_id: "",
    priority: "normal",
    contact_type: "other",
    note: "",
    needs: "",
    key_points: "",
    commitments_us: "",
    commitments_client: "",
    risks: "",
    next_step: "",
  });

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (note) {
      setFormData({
        client_id: note.client_id || "",
        contact_person: note.contact_person || "",
        offer_id: note.offer_id || "",
        note_date: note.note_date,
        salesperson_id: note.salesperson_id || "",
        priority: note.priority,
        contact_type: note.contact_type,
        note: note.note || "",
        needs: note.needs || "",
        key_points: note.key_points || "",
        commitments_us: note.commitments_us || "",
        commitments_client: note.commitments_client || "",
        risks: note.risks || "",
        next_step: note.next_step || "",
      });
    } else {
      resetForm();
      // Set current user as default salesperson for new notes
      if (currentUserId) {
        setFormData(prev => ({ ...prev, salesperson_id: currentUserId }));
      }
      if (initialClientId) {
        setFormData(prev => ({ ...prev, client_id: initialClientId }));
      }
    }
  }, [note, open, initialClientId, currentUserId]);

  useEffect(() => {
    if (formData.client_id) {
      fetchOffers(formData.client_id);
      fetchContacts(formData.client_id);
    } else {
      setOffers([]);
      setContacts([]);
    }
  }, [formData.client_id]);

  const fetchOffers = async (clientId: string) => {
    const { data } = await supabase
      .from("offers")
      .select("id, offer_number")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setOffers(data || []);
  };

  const fetchContacts = async (clientId: string) => {
    const { data } = await supabase
      .from("client_contacts")
      .select("id, full_name, email, phone, role")
      .eq("client_id", clientId)
      .order("full_name", { ascending: true });
    setContacts(data || []);
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      contact_person: "",
      offer_id: "",
      note_date: new Date().toISOString().split("T")[0],
      salesperson_id: currentUserId || "",
      priority: "normal",
      contact_type: "other",
      note: "",
      needs: "",
      key_points: "",
      commitments_us: "",
      commitments_client: "",
      risks: "",
      next_step: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that salesperson is assigned
    if (!formData.salesperson_id) {
      toast.error(t("notes.salespersonRequired", "Please assign a person to this note"));
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        client_id: formData.client_id || null,
        contact_person: formData.contact_person || null,
        offer_id: formData.offer_id || null,
        note_date: formData.note_date,
        salesperson_id: formData.salesperson_id,
        priority: formData.priority,
        contact_type: formData.contact_type,
        note: formData.note || null,
        needs: formData.needs || null,
        key_points: formData.key_points || null,
        commitments_us: formData.commitments_us || null,
        commitments_client: formData.commitments_client || null,
        risks: formData.risks || null,
        next_step: formData.next_step || null,
      };

      if (note) {
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", note.id);

        if (error) throw error;
        toast.success(t("notes.updated", "Note updated successfully"));
      } else {
        const { error } = await supabase.from("notes").insert([payload]);

        if (error) throw error;
        toast.success(t("notes.created", "Note created successfully"));
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error(t("notes.saveError", "Failed to save note"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setTaskFormOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 w-[95vw] sm:w-auto">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <DialogTitle>
              {note ? t("notes.editNote", "Edit Note") : t("notes.addNote", "Add Note")}
            </DialogTitle>
          </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-80px)] px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-4 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t("notes.client", "Client")}</Label>
                <ClientCombobox
                  clients={clients}
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value, offer_id: "" })
                  }
                  placeholder={t("notes.selectClient", "Select client")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("notes.contactPerson", "Contact Person")}</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.contact_person}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contact_person: value })
                    }
                    disabled={!formData.client_id}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t("notes.selectContact", "Select contact")} />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.full_name}>
                          {contact.full_name} {contact.role && `(${contact.role})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAddContactOpen(true)}
                    disabled={!formData.client_id}
                    title={t("notes.addContact", "Add new contact")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("notes.offer", "Offer")}</Label>
                <Select
                  value={formData.offer_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, offer_id: value })
                  }
                  disabled={!formData.client_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("notes.selectOffer", "Select offer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {offers.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.offer_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("common.date")}</Label>
                <Input
                  type="date"
                  value={formData.note_date}
                  onChange={(e) =>
                    setFormData({ ...formData, note_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("notes.person", "Person")} <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.salesperson_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, salesperson_id: value })
                  }
                >
                  <SelectTrigger className={!formData.salesperson_id ? "border-destructive" : ""}>
                    <SelectValue placeholder={t("notes.selectPerson", "Select person")} />
                  </SelectTrigger>
                  <SelectContent>
                    {salespeople.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("common.priority")}</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{t("notes.priorityNormal", "Normal")}</SelectItem>
                    <SelectItem value="high">{t("notes.priorityHigh", "High")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("notes.contactType", "Contact Type")}</Label>
                <Select
                  value={formData.contact_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, contact_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("notes.note", "Note")}</Label>
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder={t("notes.notePlaceholder", "Enter note details")}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t("notes.needs", "Needs")}</Label>
                <Textarea
                  value={formData.needs}
                  onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
                  placeholder={t("notes.needsPlaceholder", "Client needs")}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("notes.keyPoints", "Key Points")}</Label>
                <Textarea
                  value={formData.key_points}
                  onChange={(e) =>
                    setFormData({ ...formData, key_points: e.target.value })
                  }
                  placeholder={t("notes.keyPointsPlaceholder", "Key points")}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("notes.commitmentsUs", "Commitments (Us)")}</Label>
                <Textarea
                  value={formData.commitments_us}
                  onChange={(e) =>
                    setFormData({ ...formData, commitments_us: e.target.value })
                  }
                  placeholder={t("notes.commitmentsUsPlaceholder", "Our commitments")}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("notes.commitmentsClient", "Commitments (Client)")}</Label>
                <Textarea
                  value={formData.commitments_client}
                  onChange={(e) =>
                    setFormData({ ...formData, commitments_client: e.target.value })
                  }
                  placeholder={t("notes.commitmentsClientPlaceholder", "Client commitments")}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("notes.risks", "Risks")}</Label>
                <Textarea
                  value={formData.risks}
                  onChange={(e) => setFormData({ ...formData, risks: e.target.value })}
                  placeholder={t("notes.risksPlaceholder", "Potential risks")}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("notes.nextStep", "Next Step")}</Label>
                <Textarea
                  value={formData.next_step}
                  onChange={(e) =>
                    setFormData({ ...formData, next_step: e.target.value })
                  }
                  placeholder={t("notes.nextStepPlaceholder", "Next action")}
                  rows={2}
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleCreateTask}
              className="w-full sm:w-auto"
            >
              <ListTodo className="h-4 w-4 mr-2" />
              {t("notes.createTask", "Create Task")}
            </Button>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t("common.saving", "Saving...") : t("common.save")}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>

      <TaskFormSheet
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        onSuccess={() => {
          setTaskFormOpen(false);
          toast.success(t("tasks.created", "Task created successfully"));
        }}
        initialValues={{
          title: formData.next_step || "Follow-up call",
          client_id: formData.client_id || undefined,
          offer_id: formData.offer_id || undefined,
          person_to_meet: formData.contact_person || undefined,
          notes: formData.note || undefined,
          note_id: note?.id || undefined,
        }}
      />

      {formData.client_id && (
        <ContactFormDialog
          open={addContactOpen}
          onOpenChange={setAddContactOpen}
          clientId={formData.client_id}
          onSuccess={() => {
            fetchContacts(formData.client_id);
          }}
          roleOptions={["contact", "decision_maker", "technical", "billing", "other"]}
        />
      )}
    </>
  );
};
