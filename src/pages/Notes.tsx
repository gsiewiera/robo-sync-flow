import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ListTodo, TableIcon, Users, CalendarIcon, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TablePagination } from "@/components/ui/table-pagination";
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
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from "date-fns";
import { NoteFormSheet } from "@/components/notes/NoteFormSheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type DatePreset = "today" | "yesterday" | "lastWeek" | "lastMonth";

const getDateRangeForPreset = (preset: DatePreset): { from: Date; to: Date } => {
  const today = startOfDay(new Date());
  switch (preset) {
    case "today":
      return { from: today, to: endOfDay(new Date()) };
    case "yesterday":
      return { from: subDays(today, 1), to: endOfDay(subDays(new Date(), 1)) };
    case "lastWeek":
      return { from: subWeeks(today, 1), to: endOfDay(new Date()) };
    case "lastMonth":
      return { from: subMonths(today, 1), to: endOfDay(new Date()) };
  }
};

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
  const [dateFrom, setDateFrom] = useState<Date>(subWeeks(startOfDay(new Date()), 1));
  const [dateTo, setDateTo] = useState<Date>(endOfDay(new Date()));
  const [datePreset, setDatePreset] = useState<DatePreset>("lastWeek");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grouped" | "stats">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

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

    const noteDate = new Date(note.note_date);
    const matchesDate = noteDate >= startOfDay(dateFrom) && noteDate <= endOfDay(dateTo);

    return matchesSearch && matchesClient && matchesType && matchesSalesperson && matchesDate;
  });

  // Pagination for table view
  const totalPages = Math.ceil(filteredNotes.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + pageSize);

  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const range = getDateRangeForPreset(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
  };

  const presetLabels: Record<DatePreset, string> = {
    today: t("notes.today", "Today"),
    yesterday: t("notes.yesterday", "Yesterday"),
    lastWeek: t("notes.lastWeek", "Last Week"),
    lastMonth: t("notes.lastMonth", "Last Month"),
  };

  // Group notes by salesperson for the grouped view
  const groupedNotes = useMemo(() => {
    const notesForRange = notes.filter(note => {
      const noteDate = new Date(note.note_date);
      return noteDate >= startOfDay(dateFrom) && noteDate <= endOfDay(dateTo);
    });
    const grouped: Record<string, { salesperson: string; notes: Note[] }> = {};
    
    notesForRange.forEach(note => {
      const salespersonId = note.salesperson_id || 'unassigned';
      const salespersonName = note.profiles?.full_name || t("notes.unassigned", "Unassigned");
      
      if (!grouped[salespersonId]) {
        grouped[salespersonId] = { salesperson: salespersonName, notes: [] };
      }
      grouped[salespersonId].notes.push(note);
    });
    
    return Object.values(grouped).sort((a, b) => a.salesperson.localeCompare(b.salesperson));
  }, [notes, dateFrom, dateTo, t]);

  // Calculate stats per salesperson and day
  const statsData = useMemo(() => {
    const notesForRange = notes.filter(note => {
      const noteDate = new Date(note.note_date);
      return noteDate >= startOfDay(dateFrom) && noteDate <= endOfDay(dateTo);
    });

    const days = eachDayOfInterval({ start: dateFrom, end: dateTo });
    const salespersonMap: Record<string, { 
      id: string; 
      name: string; 
      dailyCounts: Record<string, number>; 
      total: number;
      byType: Record<string, number>;
    }> = {};

    notesForRange.forEach(note => {
      const salespersonId = note.salesperson_id || 'unassigned';
      const salespersonName = note.profiles?.full_name || t("notes.unassigned", "Unassigned");
      const noteDay = format(new Date(note.note_date), 'yyyy-MM-dd');

      if (!salespersonMap[salespersonId]) {
        salespersonMap[salespersonId] = {
          id: salespersonId,
          name: salespersonName,
          dailyCounts: {},
          total: 0,
          byType: {}
        };
      }

      salespersonMap[salespersonId].dailyCounts[noteDay] = (salespersonMap[salespersonId].dailyCounts[noteDay] || 0) + 1;
      salespersonMap[salespersonId].total += 1;
      salespersonMap[salespersonId].byType[note.contact_type] = (salespersonMap[salespersonId].byType[note.contact_type] || 0) + 1;
    });

    const salespersons = Object.values(salespersonMap).sort((a, b) => b.total - a.total);
    const totalNotes = notesForRange.length;
    const avgPerDay = days.length > 0 ? totalNotes / days.length : 0;
    const avgPerSalesperson = salespersons.length > 0 ? totalNotes / salespersons.length : 0;

    return {
      days,
      salespersons,
      totalNotes,
      avgPerDay,
      avgPerSalesperson
    };
  }, [notes, dateFrom, dateTo, t]);

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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "grouped" | "stats")} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="table" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <TableIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{t("notes.tableView", "List")}</span>
                <span className="sm:hidden">{t("notes.table", "List")}</span>
              </TabsTrigger>
              <TabsTrigger value="grouped" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{t("notes.groupedView", "By Salesperson")}</span>
                <span className="sm:hidden">{t("notes.grouped", "Grouped")}</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4" />
                {t("notes.statsView", "Stats")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleAdd} size="sm" className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t("notes.addNote", "Add Note")}
          </Button>
        </div>

        {viewMode === "table" ? (
          <>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
              <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("common.search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
                <SelectTrigger className="w-full sm:w-[150px]">
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

              <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4">
                <Select value={salespersonFilter} onValueChange={setSalespersonFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
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

                <Select value={datePreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{presetLabels.today}</SelectItem>
                    <SelectItem value="yesterday">{presetLabels.yesterday}</SelectItem>
                    <SelectItem value="lastWeek">{presetLabels.lastWeek}</SelectItem>
                    <SelectItem value="lastMonth">{presetLabels.lastMonth}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[220px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom && dateTo ? (
                      <>
                        {format(dateFrom, "MMM d, yyyy")} - {format(dateTo, "MMM d, yyyy")}
                      </>
                    ) : (
                      <span>{t("notes.selectDateRange", "Select date range")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      if (range?.from) setDateFrom(range.from);
                      if (range?.to) setDateTo(range.to);
                    }}
                    numberOfMonths={1}
                    className={cn("p-3 pointer-events-auto sm:hidden")}
                  />
                  <Calendar
                    mode="range"
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      if (range?.from) setDateFrom(range.from);
                      if (range?.to) setDateTo(range.to);
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto hidden sm:block")}
                  />
                </PopoverContent>
              </Popover>

              {(clientFilter !== "all" || typeFilter !== "all" || salespersonFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setClientFilter("all");
                    setTypeFilter("all");
                    setSalespersonFilter("all");
                    handlePresetChange("today");
                  }}
                >
                  {t("common.clear")}
                </Button>
              )}
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="h-9">
                    <TableHead className="py-1.5 text-xs">{t("notes.client", "Client")}</TableHead>
                    <TableHead className="py-1.5 text-xs">{t("notes.contactPerson", "Contact Person")}</TableHead>
                    <TableHead className="py-1.5 text-xs hidden sm:table-cell">{t("notes.offer", "Offer")}</TableHead>
                    <TableHead className="py-1.5 text-xs">{t("common.date")}</TableHead>
                    <TableHead className="py-1.5 text-xs hidden md:table-cell">{t("notes.salesperson", "Salesperson")}</TableHead>
                    <TableHead className="py-1.5 text-xs hidden lg:table-cell">{t("common.priority")}</TableHead>
                    <TableHead className="py-1.5 text-xs hidden lg:table-cell">{t("notes.contactType", "Contact Type")}</TableHead>
                    <TableHead className="py-1.5 text-xs hidden md:table-cell">{t("tasks.task", "Task")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : filteredNotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {t("notes.noNotes", "No notes found")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedNotes.map((note) => (
                      <TableRow
                        key={note.id}
                        className="h-9 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleEdit(note)}
                      >
                        <TableCell className="py-1.5 font-medium max-w-[120px] sm:max-w-none truncate">
                          {note.clients?.name || "-"}
                        </TableCell>
                        <TableCell className="py-1.5 max-w-[100px] sm:max-w-none truncate">{note.contact_person || "-"}</TableCell>
                        <TableCell className="py-1.5 hidden sm:table-cell">{note.offers?.offer_number || "-"}</TableCell>
                        <TableCell className="py-1.5 whitespace-nowrap">
                          {format(new Date(note.note_date), "yyyy-MM-dd")}
                        </TableCell>
                        <TableCell className="py-1.5 hidden md:table-cell">{note.profiles?.full_name || "-"}</TableCell>
                        <TableCell className="py-1.5 hidden lg:table-cell">{getPriorityBadge(note.priority)}</TableCell>
                        <TableCell className="py-1.5 hidden lg:table-cell">{getContactTypeBadge(note.contact_type)}</TableCell>
                        <TableCell className="py-1.5 hidden md:table-cell">
                          {note.tasks && note.tasks.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary h-6 px-2"
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredNotes.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredNotes.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            )}
          </>
        ) : viewMode === "grouped" ? (
          <>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <Select value={datePreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{presetLabels.today}</SelectItem>
                  <SelectItem value="yesterday">{presetLabels.yesterday}</SelectItem>
                  <SelectItem value="lastWeek">{presetLabels.lastWeek}</SelectItem>
                  <SelectItem value="lastMonth">{presetLabels.lastMonth}</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom && dateTo ? (
                      <>
                        {format(dateFrom, "MMM d, yyyy")} - {format(dateTo, "MMM d, yyyy")}
                      </>
                    ) : (
                      <span>{t("notes.selectDateRange", "Select date range")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      if (range?.from) setDateFrom(range.from);
                      if (range?.to) setDateTo(range.to);
                    }}
                    numberOfMonths={1}
                    className={cn("p-3 pointer-events-auto sm:hidden")}
                  />
                  <Calendar
                    mode="range"
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      if (range?.from) setDateFrom(range.from);
                      if (range?.to) setDateTo(range.to);
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto hidden sm:block")}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-sm text-muted-foreground">
                {t("notes.showingNotesFor", "Showing notes for")} {format(dateFrom, "MMM d")} - {format(dateTo, "MMM d, yyyy")}
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
              <>
                {(() => {
                  const contactTypes = ["email", "call", "sms", "meeting", "other"];
                  const salespersonData = groupedNotes.map(group => {
                    const counts: Record<string, number> = {};
                    contactTypes.forEach(type => counts[type] = 0);
                    group.notes.forEach(note => {
                      if (contactTypes.includes(note.contact_type)) {
                        counts[note.contact_type]++;
                      } else {
                        counts["other"]++;
                      }
                    });
                    return { name: group.salesperson, counts, total: group.notes.length };
                  });
                  const totals: Record<string, number> = {};
                  contactTypes.forEach(type => totals[type] = 0);
                  salespersonData.forEach(sp => {
                    contactTypes.forEach(type => totals[type] += sp.counts[type]);
                  });
                  const grandTotal = salespersonData.reduce((sum, sp) => sum + sp.total, 0);

                  return (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-9">
                            <TableHead className="py-1.5 text-xs font-semibold">{t("notes.salesperson", "Salesperson")}</TableHead>
                            {contactTypes.map(type => (
                              <TableHead key={type} className="py-1.5 text-xs text-center capitalize">{type}</TableHead>
                            ))}
                            <TableHead className="py-1.5 text-xs text-center font-semibold">{t("notes.total", "Total")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salespersonData.map(sp => (
                            <TableRow key={sp.name} className="h-9">
                              <TableCell className="py-1.5 text-sm font-medium">{sp.name}</TableCell>
                              {contactTypes.map(type => (
                                <TableCell key={type} className="py-1.5 text-sm text-center">
                                  {sp.counts[type] > 0 ? sp.counts[type] : "-"}
                                </TableCell>
                              ))}
                              <TableCell className="py-1.5 text-sm text-center font-semibold">{sp.total}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="h-9 bg-muted/50 font-semibold">
                            <TableCell className="py-1.5 text-sm">{t("notes.total", "Total")}</TableCell>
                            {contactTypes.map(type => (
                              <TableCell key={type} className="py-1.5 text-sm text-center">
                                {totals[type] > 0 ? totals[type] : "-"}
                              </TableCell>
                            ))}
                            <TableCell className="py-1.5 text-sm text-center">{grandTotal}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()}
                <div className="space-y-4 sm:space-y-6">
                {groupedNotes.map((group) => (
                  <Card key={group.salesperson}>
                    <CardHeader className="pb-3 px-3 sm:px-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                        {group.salesperson}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {group.notes.length} {group.notes.length === 1 ? t("notes.note", "note") : t("notes.notesPlural", "notes")}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-3 sm:px-6">
                      {group.notes.map((note) => (
                        <div
                          key={note.id}
                          className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleEdit(note)}
                        >
                          <div className="font-medium sm:min-w-[200px] text-primary text-sm sm:text-base">
                            {note.clients?.name || "-"}
                          </div>
                          <div className="flex-1 text-muted-foreground text-sm line-clamp-2">
                            {note.note || "-"}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
              <Select value={datePreset} onValueChange={(v) => handlePresetChange(v as DatePreset)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">{presetLabels.today}</SelectItem>
                  <SelectItem value="yesterday">{presetLabels.yesterday}</SelectItem>
                  <SelectItem value="lastWeek">{presetLabels.lastWeek}</SelectItem>
                  <SelectItem value="lastMonth">{presetLabels.lastMonth}</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom && dateTo ? (
                      <>
                        {format(dateFrom, "MMM d, yyyy")} - {format(dateTo, "MMM d, yyyy")}
                      </>
                    ) : (
                      <span>{t("notes.selectDateRange", "Select date range")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      if (range?.from) setDateFrom(range.from);
                      if (range?.to) setDateTo(range.to);
                    }}
                    numberOfMonths={1}
                    className={cn("p-3 pointer-events-auto sm:hidden")}
                  />
                  <Calendar
                    mode="range"
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      if (range?.from) setDateFrom(range.from);
                      if (range?.to) setDateTo(range.to);
                    }}
                    numberOfMonths={2}
                    className={cn("p-3 pointer-events-auto hidden sm:block")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("notes.totalNotes", "Total Notes")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.totalNotes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("notes.avgPerDay", "Avg per Day")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.avgPerDay.toFixed(1)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t("notes.avgPerSalesperson", "Avg per Salesperson")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statsData.avgPerSalesperson.toFixed(1)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10">{t("notes.salesperson", "Salesperson")}</TableHead>
                    {statsData.days.map(day => (
                      <TableHead key={day.toISOString()} className="text-center min-w-[80px]">
                        {format(day, "MMM d")}
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-bold">{t("notes.total", "Total")}</TableHead>
                    <TableHead className="text-center">{t("notes.avgDay", "Avg/Day")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData.salespersons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={statsData.days.length + 3} className="text-center py-8 text-muted-foreground">
                        {t("notes.noStatsData", "No data for selected period")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {statsData.salespersons.map(sp => (
                        <TableRow key={sp.id}>
                          <TableCell className="sticky left-0 bg-background font-medium">{sp.name}</TableCell>
                          {statsData.days.map(day => {
                            const dayKey = format(day, 'yyyy-MM-dd');
                            const count = sp.dailyCounts[dayKey] || 0;
                            return (
                              <TableCell key={dayKey} className="text-center">
                                <span className={cn(
                                  count === 0 ? "text-muted-foreground" : "",
                                  count >= statsData.avgPerDay ? "text-green-600 font-medium" : ""
                                )}>
                                  {count}
                                </span>
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold">{sp.total}</TableCell>
                          <TableCell className="text-center">
                            {statsData.days.length > 0 ? (sp.total / statsData.days.length).toFixed(1) : 0}
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell className="sticky left-0 bg-muted/50">{t("notes.total", "Total")}</TableCell>
                        {statsData.days.map(day => {
                          const dayKey = format(day, 'yyyy-MM-dd');
                          const dayTotal = statsData.salespersons.reduce((sum, sp) => sum + (sp.dailyCounts[dayKey] || 0), 0);
                          return (
                            <TableCell key={dayKey} className="text-center font-bold">
                              {dayTotal}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold">{statsData.totalNotes}</TableCell>
                        <TableCell className="text-center font-bold">
                          {statsData.avgPerDay.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Contact Type Breakdown */}
            {statsData.salespersons.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">{t("notes.byContactType", "By Contact Type")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statsData.salespersons.map(sp => (
                    <Card key={sp.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{sp.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2">
                        {Object.entries(sp.byType).map(([type, count]) => (
                          <Badge key={type} variant="outline">
                            {type}: {count}
                          </Badge>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
