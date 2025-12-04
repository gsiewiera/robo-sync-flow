import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, X, Mail, Plus } from "lucide-react";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";
import { NewContractDialog } from "@/components/contracts/NewContractDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelectDropdown } from "@/components/ui/searchable-filter-dropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  monthly_payment: number | null;
  created_at: string | null;
  clients: { name: string } | null;
}

interface ContractStatus {
  id: string;
  name: string;
  color: string;
  display_order: number;
}

const Contracts = () => {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [contractStatuses, setContractStatuses] = useState<ContractStatus[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"contract_number" | "start_date" | "end_date" | "created_at">("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showNewContractDialog, setShowNewContractDialog] = useState(false);
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(20);

  const getStatusColor = (statusName: string) => {
    const status = contractStatuses.find(s => s.name === statusName);
    return status?.color || '#6b7280';
  };

  const columns: ColumnConfig[] = [
    { key: "contract_number", label: t("contracts.contractNumber"), defaultVisible: true },
    { key: "client", label: t("contracts.client"), defaultVisible: true },
    { key: "status", label: t("common.status"), defaultVisible: true },
    { key: "start_date", label: t("contracts.startDate"), defaultVisible: true },
    { key: "end_date", label: t("contracts.endDate"), defaultVisible: true },
    { key: "monthly_payment", label: t("contracts.monthlyPayment"), defaultVisible: true },
    { key: "created_at", label: t("common.created"), defaultVisible: false },
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
    fetchContracts();
    fetchClients();
    fetchContractStatuses();
  }, []);

  const fetchContractStatuses = async () => {
    const { data } = await supabase
      .from("contract_status_dictionary")
      .select("*")
      .order("display_order");

    if (data) {
      setContractStatuses(data);
    }
  };

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (data) {
      setClients(data);
    }
  };

  const fetchContracts = async () => {
    let query = supabase
      .from("contracts")
      .select("*, clients(name)")
      .order(sortField, { ascending: sortDirection === "asc", nullsFirst: false });

    if (filterClient !== "all") {
      query = query.eq("client_id", filterClient);
    }

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus as any);
    }

    const { data, error } = await query;

    if (data && !error) {
      setContracts(data);
    }
  };

  useEffect(() => {
    fetchContracts();
    setCurrentPage(1);
  }, [sortField, sortDirection, filterClient, filterStatus]);

  const indexOfLastRecord = currentPage * pageSize;
  const indexOfFirstRecord = indexOfLastRecord - pageSize;
  const currentRecords = contracts.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(contracts.length / pageSize);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (field: "contract_number" | "start_date" | "end_date" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "contract_number" | "start_date" | "end_date" | "created_at") => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const clearFilters = () => {
    setFilterClient("all");
    setFilterStatus("all");
  };

  const hasActiveFilters = filterClient !== "all" || filterStatus !== "all";

  const openEmailDialog = (contract: Contract) => {
    setSelectedContract(contract);
    setRecipientEmail("");
    setEmailDialogOpen(true);
  };

  const sendEmail = async () => {
    if (!selectedContract || !recipientEmail) {
      toast.error("Please enter a recipient email");
      return;
    }

    setIsSendingEmail(true);

    try {
      // Fetch latest contract version
      const { data: versions, error: versionsError } = await supabase
        .from("contract_versions")
        .select("*")
        .eq("contract_id", selectedContract.id)
        .order("version_number", { ascending: false })
        .limit(1);

      if (versionsError) throw versionsError;

      if (!versions || versions.length === 0) {
        toast.error("No contract PDF version found. Please generate a PDF first.");
        setIsSendingEmail(false);
        return;
      }

      const latestVersion = versions[0];

      // Call edge function
      const { error } = await supabase.functions.invoke("send-contract-email", {
        body: {
          contractNumber: selectedContract.contract_number,
          versionId: latestVersion.id,
          clientEmail: recipientEmail,
          clientName: selectedContract.clients?.name || "Client",
          filePath: latestVersion.file_path,
        },
      });

      if (error) throw error;

      toast.success("Contract email sent successfully!");
      setEmailDialogOpen(false);
      setRecipientEmail("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button size="sm" onClick={() => setShowNewContractDialog(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("contracts.newContract")}
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t("contracts.client")}</label>
                <SearchableSelectDropdown
                  options={clients.map((c) => ({ id: c.id, label: c.name }))}
                  value={filterClient}
                  onChange={setFilterClient}
                  placeholder={t("contracts.allClients")}
                  searchPlaceholder="Search client..."
                  allLabel={t("contracts.allClients")}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t("common.status")}</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("contracts.allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("contracts.allStatuses")}</SelectItem>
                    {contractStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {t(`status.${status.name}`, status.name.replace(/_/g, ' '))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t("common.clear")}
                </Button>
              )}
              <ColumnVisibilityToggle
                columns={columns}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn}
              />
            </div>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                {visibleColumns.includes("contract_number") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("contract_number")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      {t("contracts.contractNumber")}
                      {getSortIcon("contract_number")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("client") && (
                  <TableHead className="py-1.5 text-xs">{t("contracts.client")}</TableHead>
                )}
                {visibleColumns.includes("status") && (
                  <TableHead className="py-1.5 text-xs">{t("common.status")}</TableHead>
                )}
                {visibleColumns.includes("start_date") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("start_date")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      {t("contracts.startDate")}
                      {getSortIcon("start_date")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("end_date") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("end_date")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      {t("contracts.endDate")}
                      {getSortIcon("end_date")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("monthly_payment") && (
                  <TableHead className="py-1.5 text-xs">{t("contracts.monthlyPayment")}</TableHead>
                )}
                {visibleColumns.includes("created_at") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("created_at")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      {t("common.created")}
                      {getSortIcon("created_at")}
                    </Button>
                  </TableHead>
                )}
                <TableHead className="w-16 py-1.5 text-xs">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                    {t("contracts.noContracts")}
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((contract) => (
                  <TableRow 
                    key={contract.id} 
                    className="h-9 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    {visibleColumns.includes("contract_number") && (
                      <TableCell className="py-1.5 text-sm font-medium">{contract.contract_number}</TableCell>
                    )}
                    {visibleColumns.includes("client") && (
                      <TableCell className="py-1.5 text-sm">{contract.clients?.name || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("status") && (
                      <TableCell className="py-1.5">
                        <Badge 
                          className="text-xs px-1.5 py-0" 
                          style={{ backgroundColor: getStatusColor(contract.status), color: '#fff' }}
                        >
                          {t(`status.${contract.status}`, contract.status.replace(/_/g, ' '))}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("start_date") && (
                      <TableCell className="py-1.5 text-sm">
                        {contract.start_date
                          ? new Date(contract.start_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("end_date") && (
                      <TableCell className="py-1.5 text-sm">
                        {contract.end_date
                          ? new Date(contract.end_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("monthly_payment") && (
                      <TableCell className="py-1.5 text-sm">
                        {contract.monthly_payment
                          ? `${formatMoney(contract.monthly_payment)} PLN`
                          : "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("created_at") && (
                      <TableCell className="py-1.5 text-sm">
                        {contract.created_at
                          ? new Date(contract.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    )}
                    <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => openEmailDialog(contract)}
                          title="Send email"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          title="View details"
                        >
                          <Eye className="h-3.5 w-3.5" />
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
          totalItems={contracts.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        <AlertDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("contracts.sendEmail")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("contracts.emailDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("contracts.recipientEmail")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="client@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSendingEmail}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={sendEmail} disabled={isSendingEmail}>
                {isSendingEmail ? t("common.sending") : t("common.send")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <NewContractDialog
          open={showNewContractDialog}
          onOpenChange={setShowNewContractDialog}
          onSuccess={fetchContracts}
        />
      </div>
    </Layout>
  );
};

export default Contracts;
