import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Filter, CalendarIcon, X, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";
import { TablePagination } from "@/components/ui/table-pagination";

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount_net: number;
  amount_gross: number;
  status: string;
  paid_date: string | null;
  currency: string;
  clients: {
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { toast } = useToast();

  const columns: ColumnConfig[] = [
    { key: "invoice_number", label: "Invoice #", defaultVisible: true },
    { key: "client", label: "Client", defaultVisible: true },
    { key: "issue_date", label: "Issue Date", defaultVisible: true },
    { key: "due_date", label: "Due Date", defaultVisible: true },
    { key: "amount_net", label: "Amount (Net)", defaultVisible: true },
    { key: "amount_gross", label: "Amount (Gross)", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "paid_date", label: "Paid Date", defaultVisible: false },
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
    fetchClients();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedClient, selectedStatus, startDate, endDate]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load clients",
        variant: "destructive",
      });
      return;
    }

    setClients(data || []);
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("invoices")
        .select(`
          *,
          clients (
            name
          )
        `)
        .order("issue_date", { ascending: false });

      if (selectedClient !== "all") {
        query = query.eq("client_id", selectedClient);
      }

      if (selectedStatus !== "all") {
        if (selectedStatus === "paid") {
          query = query.not("paid_date", "is", null);
        } else {
          query = query.eq("status", selectedStatus).is("paid_date", null);
        }
      }

      if (startDate) {
        query = query.gte("issue_date", format(startDate, "yyyy-MM-dd"));
      }

      if (endDate) {
        query = query.lte("issue_date", format(endDate, "yyyy-MM-dd"));
      }

      const { data, error } = await query;

      if (error) throw error;

      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(invoices.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedInvoices = invoices.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status: string, paidDate: string | null) => {
    if (paidDate) {
      return <Badge className="bg-success text-success-foreground text-xs px-1.5 py-0">Paid</Badge>;
    }

    switch (status) {
      case "paid":
        return <Badge className="bg-success text-success-foreground text-xs px-1.5 py-0">Paid</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-xs px-1.5 py-0">Pending</Badge>;
      case "overdue":
        return <Badge variant="destructive" className="text-xs px-1.5 py-0">Overdue</Badge>;
      default:
        return <Badge variant="outline" className="text-xs px-1.5 py-0">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setSelectedClient("all");
    setSelectedStatus("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = 
    selectedClient !== "all" || 
    selectedStatus !== "all" || 
    startDate !== undefined || 
    endDate !== undefined;

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || "Unknown Client";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
        </div>

        <Card className="shadow-lg border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Client
                </Label>
                <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientPopoverOpen}
                      className="w-full justify-between bg-background"
                    >
                      {selectedClient === "all"
                        ? "All Clients"
                        : clients.find((client) => client.id === selectedClient)?.name || "Select client"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 z-50 bg-background" align="start">
                    <Command className="bg-background">
                      <CommandInput placeholder="Search client..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No client found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setSelectedClient("all");
                              setClientPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClient === "all" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All Clients
                          </CommandItem>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.name}
                              onSelect={() => {
                                setSelectedClient(client.id);
                                setClientPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClient === client.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {client.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger id="status-filter" className="bg-background">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t animate-fade-in">
                <span className="text-sm text-muted-foreground mr-2">Active filters:</span>
                {selectedClient !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Client: {getClientName(selectedClient)}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSelectedClient("all")}
                    />
                  </Badge>
                )}
                {selectedStatus !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => setSelectedStatus("all")}
                    />
                  </Badge>
                )}
                {startDate && (
                  <Badge variant="secondary" className="gap-1">
                    From: {format(startDate, "MMM dd, yyyy")}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => setStartDate(undefined)}
                    />
                  </Badge>
                )}
                {endDate && (
                  <Badge variant="secondary" className="gap-1">
                    To: {format(endDate, "MMM dd, yyyy")}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                      onClick={() => setEndDate(undefined)}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-6 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle>Invoice List</CardTitle>
              <div className="flex items-center gap-2">
                {!isLoading && invoices.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    Showing {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
                  </Badge>
                )}
                <ColumnVisibilityToggle
                  columns={columns}
                  visibleColumns={visibleColumns}
                  onToggleColumn={toggleColumn}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No invoices found
                </p>
                {hasActiveFilters && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters to see more results
                  </p>
                )}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="h-9">
                        {visibleColumns.includes("invoice_number") && (
                          <TableHead className="py-1.5 text-xs">Invoice #</TableHead>
                        )}
                        {visibleColumns.includes("client") && (
                          <TableHead className="py-1.5 text-xs">Client</TableHead>
                        )}
                        {visibleColumns.includes("issue_date") && (
                          <TableHead className="py-1.5 text-xs">Issue Date</TableHead>
                        )}
                        {visibleColumns.includes("due_date") && (
                          <TableHead className="py-1.5 text-xs">Due Date</TableHead>
                        )}
                        {visibleColumns.includes("amount_net") && (
                          <TableHead className="py-1.5 text-xs">Amount (Net)</TableHead>
                        )}
                        {visibleColumns.includes("amount_gross") && (
                          <TableHead className="py-1.5 text-xs">Amount (Gross)</TableHead>
                        )}
                        {visibleColumns.includes("status") && (
                          <TableHead className="py-1.5 text-xs">Status</TableHead>
                        )}
                        {visibleColumns.includes("paid_date") && (
                          <TableHead className="py-1.5 text-xs">Paid Date</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="h-9 hover:bg-muted/50">
                          {visibleColumns.includes("invoice_number") && (
                            <TableCell className="py-1.5 text-sm font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                          )}
                          {visibleColumns.includes("client") && (
                            <TableCell className="py-1.5 text-sm">{invoice.clients?.name || "N/A"}</TableCell>
                          )}
                          {visibleColumns.includes("issue_date") && (
                            <TableCell className="py-1.5 text-sm">
                              {format(new Date(invoice.issue_date), "MMM dd, yyyy")}
                            </TableCell>
                          )}
                          {visibleColumns.includes("due_date") && (
                            <TableCell className="py-1.5 text-sm">
                              {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                            </TableCell>
                          )}
                          {visibleColumns.includes("amount_net") && (
                            <TableCell className="py-1.5 text-sm">
                              {invoice.amount_net.toLocaleString()} {invoice.currency}
                            </TableCell>
                          )}
                          {visibleColumns.includes("amount_gross") && (
                            <TableCell className="py-1.5 text-sm">
                              {invoice.amount_gross.toLocaleString()} {invoice.currency}
                            </TableCell>
                          )}
                          {visibleColumns.includes("status") && (
                            <TableCell className="py-1.5">
                              {getStatusBadge(invoice.status, invoice.paid_date)}
                            </TableCell>
                          )}
                          {visibleColumns.includes("paid_date") && (
                            <TableCell className="py-1.5 text-sm">
                              {invoice.paid_date
                                ? format(new Date(invoice.paid_date), "MMM dd, yyyy")
                                : "-"}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={invoices.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Invoices;
