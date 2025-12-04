import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatMoney } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, ChevronDown, Plus, Edit } from "lucide-react";
import { NewOfferDialog } from "@/components/offers/NewOfferDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchableFilterDropdown } from "@/components/ui/searchable-filter-dropdown";
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
import { TablePagination } from "@/components/ui/table-pagination";

interface Offer {
  id: string;
  offer_number: string;
  stage: string;
  total_price: number | null;
  created_at: string;
  clients: { name: string; id: string } | null;
  assigned_salesperson_id: string | null;
  profiles: { full_name: string; id: string } | null;
}

interface Salesperson {
  id: string;
  full_name: string;
}

interface Client {
  id: string;
  name: string;
}

const COLUMN_CONFIG: ColumnConfig[] = [
  { key: "offer_number", label: "Offer Number", defaultVisible: true },
  { key: "client", label: "Client", defaultVisible: true },
  { key: "salesperson", label: "Salesperson", defaultVisible: true },
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
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"offer_number" | "total_price" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [clientFilters, setClientFilters] = useState<string[]>([]);
  const [salespersonFilters, setSalespersonFilters] = useState<string[]>([]);
  const [stageFilters, setStageFilters] = useState<Array<"leads" | "qualified" | "proposal_sent" | "negotiation" | "closed_won" | "closed_lost">>([]);
  const [createdDateFilter, setCreatedDateFilter] = useState<string>("");
  const [isNewOfferOpen, setIsNewOfferOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(20);

  // Column visibility state with localStorage
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("offers-visible-columns");
    return saved ? JSON.parse(saved) : COLUMN_CONFIG.filter(c => c.defaultVisible).map(c => c.key);
  });

  useEffect(() => {
    fetchOffers();
    fetchClients();
    fetchSalespeople();
  }, []);

  const fetchSalespeople = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (data && !error) {
      setSalespeople(data);
    }
  };

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
    const { data, error } = await supabase
      .from("offers")
      .select("*, clients(name, id)")
      .order(sortField, { ascending: sortDirection === "asc", nullsFirst: false });

    if (data && !error) {
      // Fetch salesperson names separately
      const salespersonIds = [...new Set(data.filter(o => o.assigned_salesperson_id).map(o => o.assigned_salesperson_id))];
      let salespersonMap: Record<string, string> = {};
      
      if (salespersonIds.length > 0) {
        const { data: salespersonData } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", salespersonIds as string[]);
        
        if (salespersonData) {
          salespersonMap = Object.fromEntries(salespersonData.map(s => [s.id, s.full_name]));
        }
      }

      let filteredData = data.map(offer => ({
        ...offer,
        profiles: offer.assigned_salesperson_id && salespersonMap[offer.assigned_salesperson_id] 
          ? { id: offer.assigned_salesperson_id, full_name: salespersonMap[offer.assigned_salesperson_id] }
          : null
      }));

      // Apply client filters
      if (clientFilters.length > 0) {
        filteredData = filteredData.filter((offer) =>
          offer.clients && clientFilters.includes(offer.clients.id)
        );
      }

      // Apply salesperson filters
      if (salespersonFilters.length > 0) {
        filteredData = filteredData.filter((offer) =>
          offer.assigned_salesperson_id && salespersonFilters.includes(offer.assigned_salesperson_id)
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
  }, [sortField, sortDirection, clientFilters, salespersonFilters, stageFilters, createdDateFilter]);

  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const currentRecords = offers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(offers.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
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

  const toggleSalespersonFilter = (salespersonId: string) => {
    setSalespersonFilters((prev) =>
      prev.includes(salespersonId)
        ? prev.filter((id) => id !== salespersonId)
        : [...prev, salespersonId]
    );
  };

  const clearFilters = () => {
    setClientFilters([]);
    setSalespersonFilters([]);
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

  const hasActiveFilters = clientFilters.length > 0 || salespersonFilters.length > 0 || stageFilters.length > 0 || createdDateFilter !== "";

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
        <div className="flex justify-end items-center">
          <Button size="sm" onClick={() => setIsNewOfferOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("offers.addOffer")}
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              <SearchableFilterDropdown
                options={clients.map((c) => ({ id: c.id, label: c.name }))}
                selectedValues={clientFilters}
                onToggle={toggleClientFilter}
                placeholder="Client"
                searchPlaceholder="Search client..."
              />

              <SearchableFilterDropdown
                options={salespeople.map((s) => ({ id: s.id, label: s.full_name }))}
                selectedValues={salespersonFilters}
                onToggle={toggleSalespersonFilter}
                placeholder="Salesperson"
                searchPlaceholder="Search salesperson..."
              />

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
              <TableRow className="h-9">
                {visibleColumns.includes("offer_number") && (
                  <TableHead className="py-1.5 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("offer_number")}
                      className="h-6 px-1 -ml-1 text-xs font-medium hover:bg-transparent"
                    >
                      Offer Number
                      {getSortIcon("offer_number")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("client") && <TableHead className="py-1.5 text-xs">Client</TableHead>}
                {visibleColumns.includes("salesperson") && <TableHead className="py-1.5 text-xs">Salesperson</TableHead>}
                {visibleColumns.includes("status") && <TableHead className="py-1.5 text-xs">Status</TableHead>}
                {visibleColumns.includes("total_price") && (
                  <TableHead className="py-1.5 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("total_price")}
                      className="h-6 px-1 -ml-1 text-xs font-medium hover:bg-transparent"
                    >
                      Total Price
                      {getSortIcon("total_price")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("created_at") && (
                  <TableHead className="py-1.5 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("created_at")}
                      className="h-6 px-1 -ml-1 text-xs font-medium hover:bg-transparent"
                    >
                      Created
                      {getSortIcon("created_at")}
                    </Button>
                  </TableHead>
                )}
                <TableHead className="w-20 py-1.5 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-6 text-muted-foreground text-sm">
                    No offers found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((offer) => (
                  <TableRow 
                    key={offer.id} 
                    className="h-9 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/offers/${offer.id}`)}
                  >
                    {visibleColumns.includes("offer_number") && (
                      <TableCell className="py-1.5 text-sm font-medium">{offer.offer_number}</TableCell>
                    )}
                    {visibleColumns.includes("client") && (
                      <TableCell className="py-1.5 text-sm">{offer.clients?.name || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("salesperson") && (
                      <TableCell className="py-1.5 text-sm text-muted-foreground">{offer.profiles?.full_name || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("status") && (
                      <TableCell className="py-1.5">
                        <Badge className={`${statusColors[offer.stage]} text-xs px-1.5 py-0`}>
                          {offer.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("total_price") && (
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {offer.total_price
                          ? `${formatMoney(offer.total_price)} PLN`
                          : "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("created_at") && (
                      <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {new Date(offer.created_at).toLocaleDateString()}
                      </TableCell>
                    )}
                    <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => navigate(`/offers/${offer.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditOffer(offer.id)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
          totalItems={offers.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
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
