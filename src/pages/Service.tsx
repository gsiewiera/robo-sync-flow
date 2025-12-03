import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Search, X, Plus } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ServiceTicket {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  clients: { name: string } | null;
  robots: { serial_number: string } | null;
}

const statusColors: Record<string, string> = {
  open: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary text-primary-foreground",
  high: "bg-destructive text-destructive-foreground",
};

const Service = () => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"ticket_number" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTicketFormOpen, setIsTicketFormOpen] = useState(false);
  const navigate = useNavigate();
  const recordsPerPage = 30;

  const columns: ColumnConfig[] = [
    { key: "ticket_number", label: "Ticket Number", defaultVisible: true },
    { key: "title", label: "Title", defaultVisible: true },
    { key: "client", label: "Client", defaultVisible: true },
    { key: "robot", label: "Robot", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "priority", label: "Priority", defaultVisible: true },
    { key: "created_at", label: "Created", defaultVisible: false },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter((col) => col.defaultVisible).map((col) => col.key)
  );

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

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
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return tickets;
    
    const query = searchQuery.toLowerCase();
    return tickets.filter((ticket) => 
      ticket.ticket_number.toLowerCase().includes(query) ||
      (ticket.clients?.name || "").toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredTickets.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredTickets.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: "ticket_number" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "ticket_number" | "created_at") => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

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
              columns={columns}
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
                {visibleColumns.includes("ticket_number") && (
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
                {visibleColumns.includes("title") && (
                  <TableHead className="py-1.5 text-xs">Title</TableHead>
                )}
                {visibleColumns.includes("client") && (
                  <TableHead className="py-1.5 text-xs">Client</TableHead>
                )}
                {visibleColumns.includes("robot") && (
                  <TableHead className="py-1.5 text-xs">Robot</TableHead>
                )}
                {visibleColumns.includes("status") && (
                  <TableHead className="py-1.5 text-xs">Status</TableHead>
                )}
                {visibleColumns.includes("priority") && (
                  <TableHead className="py-1.5 text-xs">Priority</TableHead>
                )}
                {visibleColumns.includes("created_at") && (
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
                <TableHead className="w-16 py-1.5 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground text-sm">
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
                    {visibleColumns.includes("ticket_number") && (
                      <TableCell className="py-1.5 text-sm font-medium">{ticket.ticket_number}</TableCell>
                    )}
                    {visibleColumns.includes("title") && (
                      <TableCell className="py-1.5 text-sm">{ticket.title}</TableCell>
                    )}
                    {visibleColumns.includes("client") && (
                      <TableCell className="py-1.5 text-sm">{ticket.clients?.name || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("robot") && (
                      <TableCell className="py-1.5 text-sm">{ticket.robots?.serial_number || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("status") && (
                      <TableCell className="py-1.5">
                        <Badge className={`${statusColors[ticket.status]} text-xs px-1.5 py-0`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("priority") && (
                      <TableCell className="py-1.5">
                        <Badge className={`${priorityColors[ticket.priority]} text-xs px-1.5 py-0`}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("created_at") && (
                      <TableCell className="py-1.5 text-sm">
                        {new Date(ticket.created_at).toLocaleDateString()}
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

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

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
