import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
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
  const navigate = useNavigate();
  const recordsPerPage = 20;

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

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = tickets.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(tickets.length / recordsPerPage);

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
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Tickets</h1>
          <p className="text-muted-foreground">Manage service requests and interventions</p>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("ticket_number")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    Ticket Number
                    {getSortIcon("ticket_number")}
                  </Button>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Robot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("created_at")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    Created
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No service tickets found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((ticket) => (
                  <TableRow key={ticket.id} className="h-12">
                    <TableCell className="font-medium">{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>{ticket.clients?.name || "-"}</TableCell>
                    <TableCell>{ticket.robots?.serial_number || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[ticket.status]}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/service/${ticket.id}`)}
                      >
                        <Eye className="h-4 w-4" />
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
      </div>
    </Layout>
  );
};

export default Service;
