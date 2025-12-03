import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ListTodo, TableIcon, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { NoteFormSheet } from "@/components/notes/NoteFormSheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  created_at: string;
  clients?: { name: string } | null;
  offers?: { offer_number: string } | null;
  profiles?: { full_name: string } | null;
  tasks?: { id: string; title: string; status: string }[] | null;
}

interface Client {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  full_name: string;
}

const Notes = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [salespeople, setSalespeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [salespersonFilter, setSalespersonFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grouped">("table");

  useEffect(() => {
    fetchNotes();
    fetchClients();
    fetchSalespeople();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          clients(name),
          offers(offer_number),
          profiles:salesperson_id(full_name),
          tasks(id, title, status)
        `)
        .order("note_date", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");
    setClients(data || []);
  };

  const fetchSalespeople = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    setSalespeople(data || []);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingNote(null);
    setSheetOpen(true);
  };

  const handleSuccess = () => {
    fetchNotes();
    setSheetOpen(false);
    setEditingNote(null);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      !search ||
      note.note?.toLowerCase().includes(search.toLowerCase()) ||
      note.contact_person?.toLowerCase().includes(search.toLowerCase()) ||
      note.clients?.name.toLowerCase().includes(search.toLowerCase());

    const matchesClient =
      clientFilter === "all" || note.client_id === clientFilter;

    const matchesType =
      typeFilter === "all" || note.contact_type === typeFilter;

    const matchesSalesperson =
      salespersonFilter === "all" || note.salesperson_id === salespersonFilter;

    const matchesDate =
      !dateFilter || note.note_date === dateFilter;

    return matchesSearch && matchesClient && matchesType && matchesSalesperson && matchesDate;
  });

  // Group notes by salesperson for the grouped view
  const groupedNotes = useMemo(() => {
    const notesForDate = notes.filter(note => note.note_date === dateFilter);
    const grouped: Record<string, { salesperson: string; notes: Note[] }> = {};
    
    notesForDate.forEach(note => {
      const salespersonId = note.salesperson_id || 'unassigned';
      const salespersonName = note.profiles?.full_name || t("notes.unassigned", "Unassigned");
      
      if (!grouped[salespersonId]) {
        grouped[salespersonId] = { salesperson: salespersonName, notes: [] };
      }
      grouped[salespersonId].notes.push(note);
    });
    
    return Object.values(grouped).sort((a, b) => a.salesperson.localeCompare(b.salesperson));
  }, [notes, dateFilter, t]);

  const getPriorityBadge = (priority: string) => {
    return priority === "high" ? (
      <Badge variant="destructive">High</Badge>
    ) : (
      <Badge variant="secondary">Normal</Badge>
    );
  };

  const getContactTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      email: "default",
      call: "secondary",
      sms: "outline",
      other: "outline",
    };
    return <Badge variant={variants[type] || "outline"}>{type}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "grouped")}>
            <TabsList>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <TableIcon className="h-4 w-4" />
                {t("notes.tableView", "Table View")}
              </TabsTrigger>
              <TabsTrigger value="grouped" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("notes.groupedView", "By Salesperson")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t("notes.addNote", "Add Note")}
          </Button>
        </div>

        {viewMode === "table" ? (
          <>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("notes.allClients", "All Clients")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notes.allClients", "All Clients")}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={t("notes.allTypes", "All Types")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notes.allTypes", "All Types")}</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t("notes.allSalespeople", "All Salespeople")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("notes.allSalespeople", "All Salespeople")}</SelectItem>
                  {salespeople.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-[150px]"
              />

              {(clientFilter !== "all" || typeFilter !== "all" || salespersonFilter !== "all" || dateFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClientFilter("all");
                    setTypeFilter("all");
                    setSalespersonFilter("all");
                    setDateFilter(format(new Date(), "yyyy-MM-dd"));
                  }}
                >
                  {t("common.clear")}
                </Button>
              )}
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("notes.client", "Client")}</TableHead>
                    <TableHead>{t("notes.contactPerson", "Contact Person")}</TableHead>
                    <TableHead>{t("notes.offer", "Offer")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("notes.salesperson", "Salesperson")}</TableHead>
                    <TableHead>{t("common.priority")}</TableHead>
                    <TableHead>{t("notes.contactType", "Contact Type")}</TableHead>
                    <TableHead>{t("tasks.task", "Task")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : filteredNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {t("notes.noNotes", "No notes found")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotes.map((note) => (
                      <TableRow
                        key={note.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEdit(note)}
                      >
                        <TableCell className="font-medium">
                          {note.clients?.name || "-"}
                        </TableCell>
                        <TableCell>{note.contact_person || "-"}</TableCell>
                        <TableCell>{note.offers?.offer_number || "-"}</TableCell>
                        <TableCell>
                          {format(new Date(note.note_date), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell>{note.profiles?.full_name || "-"}</TableCell>
                        <TableCell>{getPriorityBadge(note.priority)}</TableCell>
                        <TableCell>{getContactTypeBadge(note.contact_type)}</TableCell>
                        <TableCell>
                          {note.tasks && note.tasks.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tasks?taskId=${note.tasks![0].id}`);
                              }}
                            >
                              <ListTodo className="h-4 w-4 mr-1" />
                              {note.tasks[0].title}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            {t("common.view")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-[180px]"
              />
              <span className="text-muted-foreground">
                {t("notes.showingNotesFor", "Showing notes for")} {dateFilter ? format(new Date(dateFilter), "MMMM d, yyyy") : "-"}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : groupedNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("notes.noNotesForDate", "No notes found for this date")}
              </div>
            ) : (
              <div className="space-y-6">
                {groupedNotes.map((group) => (
                  <Card key={group.salesperson}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
                        {group.salesperson}
                        <Badge variant="secondary" className="ml-2">
                          {group.notes.length} {group.notes.length === 1 ? t("notes.note", "note") : t("notes.notesPlural", "notes")}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {group.notes.map((note) => (
                        <div
                          key={note.id}
                          className="flex gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleEdit(note)}
                        >
                          <div className="font-medium min-w-[200px] text-primary">
                            {note.clients?.name || "-"}
                          </div>
                          <div className="flex-1 text-muted-foreground line-clamp-2">
                            {note.note || "-"}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <NoteFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        note={editingNote}
        onSuccess={handleSuccess}
        clients={clients}
        salespeople={salespeople}
      />
    </Layout>
  );
};

export default Notes;
