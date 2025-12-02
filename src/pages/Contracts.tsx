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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_signature: "bg-warning text-warning-foreground",
  active: "bg-success text-success-foreground",
  expired: "bg-destructive text-destructive-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const Contracts = () => {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
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
  const recordsPerPage = 20;

  useEffect(() => {
    fetchContracts();
    fetchClients();
  }, []);

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

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = contracts.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(contracts.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("contracts.title")}</h1>
            <p className="text-muted-foreground">{t("contracts.description")}</p>
          </div>
          <Button onClick={() => setShowNewContractDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
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
                    <SelectItem value="draft">{t("status.draft")}</SelectItem>
                    <SelectItem value="pending_signature">{t("status.pending_signature")}</SelectItem>
                    <SelectItem value="active">{t("status.active")}</SelectItem>
                    <SelectItem value="expired">{t("status.expired")}</SelectItem>
                    <SelectItem value="cancelled">{t("status.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="mt-6"
              >
                <X className="h-4 w-4 mr-2" />
                {t("common.clear")}
              </Button>
            )}
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
                    onClick={() => handleSort("contract_number")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    {t("contracts.contractNumber")}
                    {getSortIcon("contract_number")}
                  </Button>
                </TableHead>
                <TableHead>{t("contracts.client")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("start_date")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    {t("contracts.startDate")}
                    {getSortIcon("start_date")}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("end_date")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    {t("contracts.endDate")}
                    {getSortIcon("end_date")}
                  </Button>
                </TableHead>
                <TableHead>{t("contracts.monthlyPayment")}</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort("created_at")}
                    className="h-8 px-2 -ml-2 font-medium hover:bg-transparent"
                  >
                    {t("common.created")}
                    {getSortIcon("created_at")}
                  </Button>
                </TableHead>
                <TableHead className="w-20">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {t("contracts.noContracts")}
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((contract) => (
                  <TableRow 
                    key={contract.id} 
                    className="h-12 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <TableCell className="font-medium">{contract.contract_number}</TableCell>
                    <TableCell>{contract.clients?.name || "-"}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[contract.status]}>
                        {t(`status.${contract.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contract.start_date
                        ? new Date(contract.start_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {contract.end_date
                        ? new Date(contract.end_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {contract.monthly_payment
                        ? `${formatMoney(contract.monthly_payment)} PLN`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {contract.created_at
                        ? new Date(contract.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEmailDialog(contract)}
                          title="Send email"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
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
    </>
  );
};

export default Contracts;
