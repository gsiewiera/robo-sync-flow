import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
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

interface Client {
  id: string;
  name: string;
  nip: string | null;
  city: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  created_at: string | null;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | "city" | "created_at">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const navigate = useNavigate();
  const recordsPerPage = 20;

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order(sortField, { ascending: sortDirection === "asc" });

    if (data && !error) {
      setClients(data);
    }
  };

  useEffect(() => {
    fetchClients();
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase()) ||
    client.nip?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredClients.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredClients.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: "name" | "city" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "name" | "city" | "created_at") => {
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">Manage your client relationships</p>
          </div>
          <Button onClick={() => setIsClientDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search clients by name or NIP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("name")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    Name
                    {getSortIcon("name")}
                  </Button>
                </TableHead>
                <TableHead>NIP</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("city")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    City
                    {getSortIcon("city")}
                  </Button>
                </TableHead>
                <TableHead>Contact</TableHead>
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
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((client) => (
                  <TableRow key={client.id} className="h-12">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.nip || "-"}</TableCell>
                    <TableCell>{client.city || "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {client.primary_contact_name && (
                          <div className="font-medium">{client.primary_contact_name}</div>
                        )}
                        {client.primary_contact_email && (
                          <div className="text-muted-foreground">{client.primary_contact_email}</div>
                        )}
                        {client.primary_contact_phone && (
                          <div className="text-muted-foreground">{client.primary_contact_phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.created_at
                        ? new Date(client.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => navigate(`/clients/${client.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingClient(client);
                            setIsClientDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
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

      <ClientFormDialog
        open={isClientDialogOpen}
        onOpenChange={(open) => {
          setIsClientDialogOpen(open);
          if (!open) setEditingClient(null);
        }}
        onSuccess={() => {
          fetchClients();
          setEditingClient(null);
        }}
        client={editingClient}
      />
    </Layout>
  );
};

export default Clients;
