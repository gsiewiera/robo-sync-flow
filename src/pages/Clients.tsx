import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Plus, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Edit, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchableFilterDropdown } from "@/components/ui/searchable-filter-dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";

interface Client {
  id: string;
  name: string;
  nip: string | null;
  city: string | null;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  created_at: string | null;
  assigned_salesperson_id: string | null;
}

interface Salesperson {
  id: string;
  full_name: string;
}

const Clients = () => {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | "city" | "created_at">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [clientTags, setClientTags] = useState<Record<string, any[]>>({});
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [salespersonFilters, setSalespersonFilters] = useState<string[]>([]);
  const [salespersonMap, setSalespersonMap] = useState<Record<string, string>>({});
  const [clientTypes, setClientTypes] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientTypeFilters, setSelectedClientTypeFilters] = useState<string[]>([]);
  const [clientClientTypes, setClientClientTypes] = useState<Record<string, string[]>>({});
  const [markets, setMarkets] = useState<{ id: string; name: string }[]>([]);
  const [selectedMarketFilters, setSelectedMarketFilters] = useState<string[]>([]);
  const [clientMarkets, setClientMarkets] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(20);

  const columns: ColumnConfig[] = useMemo(() => [
    { key: "name", label: "Name", defaultVisible: true },
    { key: "nip", label: "NIP", defaultVisible: true },
    { key: "city", label: "City", defaultVisible: true },
    { key: "tags", label: "Tags", defaultVisible: true },
    { key: "salesperson", label: "Salesperson", defaultVisible: true },
    { key: "contact", label: "Contact", defaultVisible: true },
    { key: "created", label: "Created", defaultVisible: false },
    { key: "actions", label: "Actions", defaultVisible: true },
  ], []);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    columns.filter(c => c.defaultVisible !== false).map(c => c.key)
  );

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(k => k !== columnKey)
        : [...prev, columnKey]
    );
  };

  const isColumnVisible = (key: string) => visibleColumns.includes(key);

  useEffect(() => {
    fetchClients();
    fetchTags();
    fetchClientTags();
    fetchSalespeople();
    fetchClientTypes();
    fetchMarkets();
    fetchClientClientTypes();
    fetchClientMarkets();
  }, []);

  const fetchSalespeople = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (data && !error) {
      setSalespeople(data);
      setSalespersonMap(Object.fromEntries(data.map(s => [s.id, s.full_name])));
    }
  };

  const toggleSalespersonFilter = (salespersonId: string) => {
    setSalespersonFilters((prev) =>
      prev.includes(salespersonId)
        ? prev.filter((id) => id !== salespersonId)
        : [...prev, salespersonId]
    );
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("client_tags")
      .select("*")
      .order("name");
    
    if (data) {
      setAvailableTags(data);
    }
  };

  const fetchClientTags = async () => {
    const { data } = await supabase
      .from("client_assigned_tags")
      .select("client_id, tag_id, client_tags(*)");
    
    if (data) {
      const tagsMap: Record<string, any[]> = {};
      data.forEach(item => {
        if (!tagsMap[item.client_id]) {
          tagsMap[item.client_id] = [];
        }
        if (item.client_tags) {
          tagsMap[item.client_id].push(item.client_tags);
        }
      });
      setClientTags(tagsMap);
    }
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order(sortField, { ascending: sortDirection === "asc" });

    if (data && !error) {
      setClients(data);
    }
  };

  const fetchClientTypes = async () => {
    const { data } = await supabase
      .from("client_type_dictionary")
      .select("id, name")
      .order("name");
    
    if (data) {
      setClientTypes(data);
    }
  };

  const fetchMarkets = async () => {
    const { data } = await supabase
      .from("market_dictionary")
      .select("id, name")
      .order("name");
    
    if (data) {
      setMarkets(data);
    }
  };

  const fetchClientClientTypes = async () => {
    const { data } = await supabase
      .from("client_client_types")
      .select("client_id, client_type_id");
    
    if (data) {
      const typesMap: Record<string, string[]> = {};
      data.forEach(item => {
        if (!typesMap[item.client_id]) {
          typesMap[item.client_id] = [];
        }
        typesMap[item.client_id].push(item.client_type_id);
      });
      setClientClientTypes(typesMap);
    }
  };

  const fetchClientMarkets = async () => {
    const { data } = await supabase
      .from("client_markets")
      .select("client_id, market_id");
    
    if (data) {
      const marketsMap: Record<string, string[]> = {};
      data.forEach(item => {
        if (!marketsMap[item.client_id]) {
          marketsMap[item.client_id] = [];
        }
        marketsMap[item.client_id].push(item.market_id);
      });
      setClientMarkets(marketsMap);
    }
  };

  useEffect(() => {
    fetchClients();
    setCurrentPage(1);
  }, [sortField, sortDirection, selectedTagFilters, salespersonFilters, selectedClientTypeFilters, selectedMarketFilters]);

  const filteredClients = clients.filter((client) => {
    // Search filter
    const matchesSearch = 
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.nip?.toLowerCase().includes(search.toLowerCase());
    
    // Tag filter
    const matchesTags = selectedTagFilters.length === 0 || 
      selectedTagFilters.some(tagId => 
        clientTags[client.id]?.some(tag => tag.id === tagId)
      );
    
    // Salesperson filter
    const matchesSalesperson = salespersonFilters.length === 0 ||
      (client.assigned_salesperson_id && salespersonFilters.includes(client.assigned_salesperson_id));
    
    // Client Type filter
    const matchesClientType = selectedClientTypeFilters.length === 0 ||
      selectedClientTypeFilters.some(typeId => 
        clientClientTypes[client.id]?.includes(typeId)
      );
    
    // Market filter
    const matchesMarket = selectedMarketFilters.length === 0 ||
      selectedMarketFilters.some(marketId => 
        clientMarkets[client.id]?.includes(marketId)
      );
    
    return matchesSearch && matchesTags && matchesSalesperson && matchesClientType && matchesMarket;
  });

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagFilters(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleClientTypeFilter = (typeId: string) => {
    setSelectedClientTypeFilters(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const toggleMarketFilter = (marketId: string) => {
    setSelectedMarketFilters(prev =>
      prev.includes(marketId)
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };

  const clearFilters = () => {
    setSelectedTagFilters([]);
    setSalespersonFilters([]);
    setSelectedClientTypeFilters([]);
    setSelectedMarketFilters([]);
  };

  const hasActiveFilters = selectedTagFilters.length > 0 || salespersonFilters.length > 0 || selectedClientTypeFilters.length > 0 || selectedMarketFilters.length > 0;

  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const currentRecords = filteredClients.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredClients.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
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
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={() => setIsClientDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            {t("clients.addClient")}
          </Button>
        </div>

        <Card className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  Tags {selectedTagFilters.length > 0 && `(${selectedTagFilters.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-3 bg-background z-50">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {availableTags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-tag-${tag.id}`}
                        checked={selectedTagFilters.includes(tag.id)}
                        onCheckedChange={() => toggleTagFilter(tag.id)}
                      />
                      <label
                        htmlFor={`filter-tag-${tag.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  Client Type {selectedClientTypeFilters.length > 0 && `(${selectedClientTypeFilters.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-3 bg-background z-50">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {clientTypes.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-type-${type.id}`}
                        checked={selectedClientTypeFilters.includes(type.id)}
                        onCheckedChange={() => toggleClientTypeFilter(type.id)}
                      />
                      <label
                        htmlFor={`filter-type-${type.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {type.name}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  Market {selectedMarketFilters.length > 0 && `(${selectedMarketFilters.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-3 bg-background z-50">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {markets.map((market) => (
                    <div key={market.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-market-${market.id}`}
                        checked={selectedMarketFilters.includes(market.id)}
                        onCheckedChange={() => toggleMarketFilter(market.id)}
                      />
                      <label
                        htmlFor={`filter-market-${market.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {market.name}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <SearchableFilterDropdown
              options={salespeople.map((s) => ({ id: s.id, label: s.full_name }))}
              selectedValues={salespersonFilters}
              onToggle={toggleSalespersonFilter}
              placeholder="Salesperson"
              searchPlaceholder="Search salesperson..."
            />

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}

            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>
        </Card>

        <Card>
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="h-9">
                {isColumnVisible("name") && (
                  <TableHead className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("name")}
                      className="h-7 px-2 -ml-2 font-medium hover:bg-transparent text-xs"
                    >
                      Name
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible("nip") && <TableHead className="py-2 text-xs">NIP</TableHead>}
                {isColumnVisible("city") && (
                  <TableHead className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("city")}
                      className="h-7 px-2 -ml-2 font-medium hover:bg-transparent text-xs"
                    >
                      City
                      {getSortIcon("city")}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible("tags") && <TableHead className="py-2 text-xs">Tags</TableHead>}
                {isColumnVisible("salesperson") && <TableHead className="py-2 text-xs">Salesperson</TableHead>}
                {isColumnVisible("contact") && <TableHead className="py-2 text-xs">Contact</TableHead>}
                {isColumnVisible("created") && (
                  <TableHead className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("created_at")}
                      className="h-7 px-2 -ml-2 font-medium hover:bg-transparent text-xs"
                    >
                      Created
                      {getSortIcon("created_at")}
                    </Button>
                  </TableHead>
                )}
                {isColumnVisible("actions") && <TableHead className="w-24 py-2 text-xs">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-6 text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((client) => (
                  <TableRow 
                    key={client.id} 
                    className="h-9 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    {isColumnVisible("name") && <TableCell className="font-medium py-1.5">{client.name}</TableCell>}
                    {isColumnVisible("nip") && <TableCell className="py-1.5">{client.nip || "-"}</TableCell>}
                    {isColumnVisible("city") && <TableCell className="py-1.5">{client.city || "-"}</TableCell>}
                    {isColumnVisible("tags") && (
                      <TableCell className="py-1.5">
                        <div className="flex flex-wrap gap-0.5">
                          {clientTags[client.id]?.map((tag) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color }}
                              className="text-white text-[10px] px-1.5 py-0"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    {isColumnVisible("salesperson") && (
                      <TableCell className="py-1.5">
                        {client.assigned_salesperson_id && salespersonMap[client.assigned_salesperson_id]
                          ? salespersonMap[client.assigned_salesperson_id]
                          : "-"}
                      </TableCell>
                    )}
                    {isColumnVisible("contact") && (
                      <TableCell className="py-1.5">
                        <div className="text-xs leading-tight">
                          {client.primary_contact_name && (
                            <div className="font-medium">{client.primary_contact_name}</div>
                          )}
                          {client.primary_contact_email && (
                            <div className="text-muted-foreground truncate max-w-[180px]">{client.primary_contact_email}</div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {isColumnVisible("created") && (
                      <TableCell className="py-1.5">
                        {client.created_at
                          ? new Date(client.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    )}
                    {isColumnVisible("actions") && (
                      <TableCell onClick={(e) => e.stopPropagation()} className="py-1.5">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setEditingClient(client);
                              setIsClientDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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
          totalItems={filteredClients.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <ClientFormDialog
        open={isClientDialogOpen}
        onOpenChange={(open) => {
          setIsClientDialogOpen(open);
          if (!open) setEditingClient(null);
        }}
        onSuccess={() => {
          fetchClients();
          fetchClientTags();
          setEditingClient(null);
        }}
        client={editingClient}
      />
    </Layout>
  );
};

export default Clients;
