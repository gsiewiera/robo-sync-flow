import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, ChevronDown, Plus, Edit } from "lucide-react";
import { NewOfferDialog } from "@/components/offers/NewOfferDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ColumnVisibilityToggle,
  ColumnConfig,
} from "@/components/ui/column-visibility-toggle";
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
  stage: string;
  total_price: number | null;
  created_at: string;
  clients: { name: string; id: string } | null;
}

interface Client {
  id: string;
  name: string;
}

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: "offer_number", label: "Offer Number", defaultVisible: true },
  { key: "client", label: "Client", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "total_price", label: "Total Price", defaultVisible: true },
  { key: "created_at", label: "Created", defaultVisible: true },
];

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary text-primary-foreground",
  modified: "bg-warning text-warning-foreground",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const Offers = () => {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"offer_number" | "total_price" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [clientFilters, setClientFilters] = useState<string[]>([]);
  const [stageFilters, setStageFilters] = useState<Array<"leads" | "qualified" | "proposal_sent" | "negotiation" | "closed_won" | "closed_lost">>([]);
  const [createdDateFilter, setCreatedDateFilter] = useState<string>("");
  const [isNewOfferOpen, setIsNewOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const navigate = useNavigate();
  const recordsPerPage = 20;

  // Column visibility state with localStorage
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("offers-visible-columns");
    return saved ? JSON.parse(saved) : COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key);
  });

  useEffect(() => {
    fetchOffers();
    fetchClients();
  }, []);

  useEffect(() => {
    localStorage.setItem("offers-visible-columns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (data && !error) {
      setClients(data);
    }
  };

  const fetchOffers = async () => {
    let query = supabase
      .from("offers")
      .select("*, clients(name, id)")
      .order(sortField, { ascending: sortDirection === "asc", nullsFirst: false });

    // Apply client filters
    if (clientFilters.length > 0) {
      query = query.in("client_id", clientFilters);
    }

    // Apply stage filters
    if (stageFilters.length > 0) {
      query = query.in("stage", stageFilters);
    }

    // Apply created date filter
    if (createdDateFilter) {
      const startOfDay = new Date(createdDateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(createdDateFilter);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.gte("created_at", startOfDay.toISOString()).lte("created_at", endOfDay.toISOString());
    }

    const { data, error } = await supabase.from("offers").select("*, clients(name, id)").order(sortField, { ascending: sortDirection === "asc", nullsFirst: false });

    if (data && !error) {
      let filteredData = data;

      // Apply client filters
      if (clientFilters.length > 0) {
        filteredData = filteredData.filter((offer) =>
          offer.clients && clientFilters.includes(offer.clients.id)
        );
      }

      // Apply stage filters
      if (stageFilters.length > 0) {
        filteredData = filteredData.filter((offer) =>
          stageFilters.includes(offer.stage as any)
        );
      }

      // Apply created date filter
      if (createdDateFilter) {
        filteredData = filteredData.filter((offer) => {
          const offerDate = new Date(offer.created_at).toISOString().split("T")[0];
          return offerDate === createdDateFilter;
        });
      }

      setOffers(filteredData);
    }
  };

  useEffect(() => {
    fetchOffers();
    setCurrentPage(1);
  }, [sortField, sortDirection, clientFilters, stageFilters, createdDateFilter]);

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

  const toggleClientFilter = (clientId: string) => {
    setClientFilters((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleStageFilter = (stage: "leads" | "qualified" | "proposal_sent" | "negotiation" | "closed_won" | "closed_lost") => {
    setStageFilters((prev) =>
      prev.includes(stage)
        ? prev.filter((s) => s !== stage)
        : [...prev, stage]
    );
  };

  const clearFilters = () => {
    setClientFilters([]);
    setStageFilters([]);
    setCreatedDateFilter("");
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  const hasActiveFilters = clientFilters.length > 0 || stageFilters.length > 0 || createdDateFilter !== "";

  const handleEditOffer = async (offerId: string) => {
    const { data: offerData, error } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offerId)
      .single();

    if (error || !offerData) {
      console.error("Error fetching offer:", error);
      return;
    }

    setEditingOffer(offerData);
    setIsNewOfferOpen(true);
  };

  const handleCloseSheet = () => {
    setIsNewOfferOpen(false);
    setEditingOffer(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("offers.title")}</h1>
            <p className="text-muted-foreground">{t("offers.description")}</p>
          </div>
          <Button onClick={() => setIsNewOfferOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("offers.addOffer")}
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-[200px] justify-between">
                    Client {clientFilters.length > 0 && `(${clientFilters.length})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-3 bg-background z-50" align="start">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {clients.map((client) => (
                      <div key={client.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`client-${client.id}`}
                          checked={clientFilters.includes(client.id)}
                          onCheckedChange={() => toggleClientFilter(client.id)}
                        />
                        <label
                          htmlFor={`client-${client.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {client.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-[180px] justify-between">
                    Funnel Stage {stageFilters.length > 0 && `(${stageFilters.length})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-3 bg-background z-50" align="start">
                  <div className="space-y-2">
                    {([
                      { value: "leads" as const, label: "Leads" },
                      { value: "qualified" as const, label: "Qualified" },
                      { value: "proposal_sent" as const, label: "Proposal Sent" },
                      { value: "negotiation" as const, label: "Negotiation" },
                      { value: "closed_won" as const, label: "Closed Won" },
                      { value: "closed_lost" as const, label: "Closed Lost" },
                    ]).map((stage) => (
                      <div key={stage.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`stage-${stage.value}`}
                          checked={stageFilters.includes(stage.value)}
                          onCheckedChange={() => toggleStageFilter(stage.value)}
                        />
                        <label
                          htmlFor={`stage-${stage.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {stage.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <label htmlFor="created-date" className="text-sm font-medium text-foreground">
                  Created:
                </label>
                <input
                  id="created-date"
                  type="date"
                  value={createdDateFilter}
                  onChange={(e) => setCreatedDateFilter(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="h-10">
                  Clear Filters
                </Button>
              )}
            </div>

            <ColumnVisibilityToggle
              columns={COLUMN_CONFIG}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.includes("offer_number") && (
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
                )}
                {visibleColumns.includes("client") && <TableHead>Client</TableHead>}
                {visibleColumns.includes("status") && <TableHead>Status</TableHead>}
                {visibleColumns.includes("total_price") && (
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
                )}
                {visibleColumns.includes("created_at") && (
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
                )}
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    No offers found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((offer) => (
                  <TableRow key={offer.id} className="h-12">
                    {visibleColumns.includes("offer_number") && (
                      <TableCell className="font-medium">{offer.offer_number}</TableCell>
                    )}
                    {visibleColumns.includes("client") && (
                      <TableCell>{offer.clients?.name || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("status") && (
                      <TableCell>
                        <Badge className={statusColors[offer.stage]}>
                          {offer.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("total_price") && (
                      <TableCell>
                        {offer.total_price
                          ? `${offer.total_price.toFixed(2)} PLN`
                          : "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("created_at") && (
                      <TableCell>
                        {new Date(offer.created_at).toLocaleDateString()}
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => navigate(`/offers/${offer.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditOffer(offer.id)}
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

      <NewOfferDialog
        open={isNewOfferOpen}
        onOpenChange={handleCloseSheet}
        onSuccess={() => {
          fetchOffers();
          setEditingOffer(null);
        }}
        offer={editingOffer}
      />
    </Layout>
  );
};

export default Offers;
