import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, Search, X, Plus } from "lucide-react";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";
import { TicketFormDialog } from "@/components/service/TicketFormDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import { useSortable } from "@/hooks/use-sortable";
import { usePagination } from "@/hooks/use-pagination";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  due_date: string | null;
  clients: { name: string } | null;
  robots: { serial_number: string } | null;
}

type SortField = "ticket_number" | "created_at";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary text-primary-foreground",
  high: "bg-destructive text-destructive-foreground",
};

const COLUMNS: ColumnConfig[] = [
  { key: "ticket_number", label: "Ticket Number", defaultVisible: true },
  { key: "title", label: "Title", defaultVisible: true },
  { key: "client", label: "Client", defaultVisible: true },
  { key: "robot", label: "Robot", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "priority", label: "Priority", defaultVisible: true },
  { key: "created_at", label: "Created", defaultVisible: true },
  { key: "due_date", label: "Due Date", defaultVisible: true },
];

const Service = () => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const navigate = useNavigate();

  const { sortField, sortDirection, handleSort, getSortIcon } = useSortable<SortField>({
    defaultField: "created_at",
    defaultDirection: "desc",
  });

  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
    getPaginatedData,
    getTotalPages,
  } = usePagination<ServiceTicket>();

  const { visibleColumns, toggleColumn, isColumnVisible } = useColumnVisibility({
    columns: COLUMNS,
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("service_tickets")
      .select("*, clients(name), robots(serial_number)")
      .order(sortField, { ascending: sortDirection === "asc" });

    if (data && !error) {
      setTickets(data);
    }
  };

  useEffect(() => {
    fetchTickets();
    resetPage();
  }, [sortField, sortDirection]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;

    const query = searchQuery.toLowerCase();
    return tickets.filter(
      (ticket) =>
        ticket.ticket_number.toLowerCase().includes(query) ||
        (ticket.clients?.name || "").toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  useEffect(() => {
    resetPage();
  }, [searchQuery]);

  const currentRecords = getPaginatedData(filteredTickets);
  const totalPages = getTotalPages(filteredTickets.length);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ticket number or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ColumnVisibilityToggle
              columns={COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
            <Button onClick={() => setIsTicketFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Ticket
            </Button>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                {isColumnVisible("ticket_number") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("ticket_number")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      Ticket Number
                      {getSortIcon("ticket_number")}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible("title") && (
                  <TableHead className="py-1.5 text-xs">Title</TableHead>
                )}
                {isColumnVisible("client") && (
                  <TableHead className="py-1.5 text-xs">Client</TableHead>
                )}
                {isColumnVisible("robot") && (
                  <TableHead className="py-1.5 text-xs">Robot</TableHead>
                )}
                {isColumnVisible("status") && (
                  <TableHead className="py-1.5 text-xs">Status</TableHead>
                )}
                {isColumnVisible("priority") && (
                  <TableHead className="py-1.5 text-xs">Priority</TableHead>
                )}
                {isColumnVisible("created_at") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("created_at")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      Created
                      {getSortIcon("created_at")}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible("due_date") && (
                  <TableHead className="py-1.5 text-xs">Due Date</TableHead>
                )}
                <TableHead className="w-16 py-1.5 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    {searchQuery ? "No tickets matching your search" : "No service tickets found"}
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="h-9 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/service/${ticket.id}`)}
                  >
                    {isColumnVisible("ticket_number") && (
                      <TableCell className="py-1.5 text-sm font-medium">
                        {ticket.ticket_number}
                      </TableCell>
                    )}
                    {isColumnVisible("title") && (
                      <TableCell className="py-1.5 text-sm">{ticket.title}</TableCell>
                    )}
                    {isColumnVisible("client") && (
                      <TableCell className="py-1.5 text-sm">
                        {ticket.clients?.name || "-"}
                      </TableCell>
                    )}
                    {isColumnVisible("robot") && (
                      <TableCell className="py-1.5 text-sm">
                        {ticket.robots?.serial_number || "-"}
                      </TableCell>
                    )}
                    {isColumnVisible("status") && (
                      <TableCell className="py-1.5">
                        <Badge className={`${STATUS_COLORS[ticket.status]} text-xs px-1.5 py-0`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    )}
                    {isColumnVisible("priority") && (
                      <TableCell className="py-1.5">
                        <Badge className={`${PRIORITY_COLORS[ticket.priority]} text-xs px-1.5 py-0`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                    )}
                    {isColumnVisible("created_at") && (
                      <TableCell className="py-1.5 text-sm">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                    )}
                    {isColumnVisible("due_date") && (
                      <TableCell className="py-1.5 text-sm">
                        {ticket.due_date ? new Date(ticket.due_date).toLocaleDateString() : "-"}
                      </TableCell>
                    )}
                    <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => navigate(`/service/${ticket.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredTickets.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        <TicketFormDialog
          open={isTicketFormOpen}
          onOpenChange={setIsTicketFormOpen}
          onSuccess={() => {
            fetchTickets();
            setIsTicketFormOpen(false);
          }}
        />
      </div>
    </Layout>
  );
};

export default Service;
