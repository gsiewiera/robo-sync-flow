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

interface Offer {
  id: string;
  offer_number: string;
  status: string;
  total_price: number | null;
  created_at: string;
  clients: { name: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary text-primary-foreground",
  modified: "bg-warning text-warning-foreground",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const Offers = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"offer_number" | "total_price" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const navigate = useNavigate();
  const recordsPerPage = 20;

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from("offers")
      .select("*, clients(name)")
      .order(sortField, { ascending: sortDirection === "asc", nullsFirst: false });

    if (data && !error) {
      setOffers(data);
    }
  };

  useEffect(() => {
    fetchOffers();
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = offers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(offers.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: "offer_number" | "total_price" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "offer_number" | "total_price" | "created_at") => {
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
          <h1 className="text-3xl font-bold text-foreground">Offers</h1>
          <p className="text-muted-foreground">Track sales opportunities and proposals</p>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("offer_number")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    Offer Number
                    {getSortIcon("offer_number")}
                  </Button>
                </TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("total_price")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    Total Price
                    {getSortIcon("total_price")}
                  </Button>
                </TableHead>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No offers found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((offer) => (
                  <TableRow key={offer.id} className="h-12">
                    <TableCell className="font-medium">{offer.offer_number}</TableCell>
                    <TableCell>{offer.clients?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[offer.status]}>
                        {offer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {offer.total_price
                        ? `${offer.total_price.toFixed(2)} PLN`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(offer.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/offers/${offer.id}`)}
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

export default Offers;
