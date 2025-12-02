import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Eye, Mail, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatMoney } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ContractVersion {
  id: string;
  version_number: number;
  file_path: string;
  generated_at: string;
  generated_by: string;
  notes: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface EmailHistory {
  id: string;
  sent_to: string;
  sent_at: string;
  sent_by: string;
  status: string;
  notes: string | null;
}

interface ContractPdfGeneratorProps {
  contractId: string;
  contractNumber: string;
  contractData: any;
  clientData: any;
  robotsData: any[];
}

export const ContractPdfGenerator = ({
  contractId,
  contractNumber,
  contractData,
  clientData,
  robotsData,
}: ContractPdfGeneratorProps) => {
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [emailHistory, setEmailHistory] = useState<Record<string, EmailHistory[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPreviewVersion, setCurrentPreviewVersion] = useState<ContractVersion | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<ContractVersion | null>(null);
  const [emailAddress, setEmailAddress] = useState(clientData?.general_email || "");
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [contractId]);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from("contract_versions")
      .select("*, profiles:generated_by(full_name, email)")
      .eq("contract_id", contractId)
      .order("version_number", { ascending: false });

    if (!error && data) {
      setVersions(data as any);
      // Fetch email history for each version
      data.forEach(version => fetchEmailHistory(version.id));
    }
  };

  const fetchEmailHistory = async (versionId: string) => {
    const { data, error } = await supabase
      .from("contract_email_history")
      .select("*")
      .eq("contract_version_id", versionId)
      .order("sent_at", { ascending: false });

    if (!error && data) {
      setEmailHistory(prev => ({
        ...prev,
        [versionId]: data
      }));
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header
      let yPos = 20;
      doc.setFontSize(24);
      doc.setTextColor(59, 130, 246);
      doc.text("CONTRACT", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Contract info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Contract Number: ${contractNumber}`, 14, yPos);
      yPos += 7;
      doc.text(`Status: ${contractData.status.toUpperCase()}`, 14, yPos);
      yPos += 7;
      if (contractData.start_date) {
        doc.text(`Start Date: ${new Date(contractData.start_date).toLocaleDateString()}`, 14, yPos);
        yPos += 7;
      }
      if (contractData.end_date) {
        doc.text(`End Date: ${new Date(contractData.end_date).toLocaleDateString()}`, 14, yPos);
        yPos += 7;
      }
      yPos += 10;

      // Client Information
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Client Information", 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Name: ${clientData?.name || "N/A"}`, 14, yPos);
      yPos += 7;
      if (clientData?.address) {
        doc.text(`Address: ${clientData.address}`, 14, yPos);
        yPos += 7;
      }
      yPos += 10;

      // Contract Terms
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Contract Terms", 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
      doc.setFontSize(10);
      if (contractData.payment_model) {
        doc.text(`Payment Model: ${contractData.payment_model}`, 14, yPos);
        yPos += 7;
      }
      if (contractData.monthly_payment) {
        doc.text(`Monthly Payment: ${contractData.monthly_payment} PLN`, 14, yPos);
        yPos += 7;
      }
      if (contractData.billing_schedule) {
        doc.text(`Billing Schedule: ${contractData.billing_schedule}`, 14, yPos);
        yPos += 7;
      }
      yPos += 10;

      // Financial Summary
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246);
      doc.text("Financial Summary", 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Total Purchase Value: ${formatMoney(contractData.total_purchase_value || 0)} PLN`, 14, yPos);
      yPos += 7;
      doc.text(`Total Monthly Contracted: ${formatMoney(contractData.total_monthly_contracted || 0)} PLN`, 14, yPos);
      yPos += 10;

      // Additional Services
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text("Additional Services", 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
      doc.setFontSize(10);
      doc.text(`Warranty: ${formatMoney(contractData.warranty_cost || 0)} PLN`, 14, yPos);
      yPos += 7;
      doc.text(`Implementation: ${formatMoney(contractData.implementation_cost || 0)} PLN`, 14, yPos);
      yPos += 7;
      if (contractData.other_services_cost && contractData.other_services_cost > 0) {
        doc.text(`${contractData.other_services_description || 'Other Services'}: ${formatMoney(contractData.other_services_cost)} PLN`, 14, yPos);
        yPos += 7;
      }
      yPos += 10;

      // Robots Table
      if (robotsData.length > 0) {
        const tableData = robotsData.map((robot) => [
          robot.model,
          robot.serial_number,
          robot.type,
          robot.status,
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Model", "Serial Number", "Type", "Status"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [59, 130, 246] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Terms
      if (contractData.terms) {
        doc.setFontSize(10);
        const splitTerms = doc.splitTextToSize(contractData.terms, pageWidth - 28);
        doc.text("Additional Terms:", 14, yPos);
        yPos += 7;
        doc.text(splitTerms, 14, yPos);
      }

      // Convert PDF to blob
      const pdfBlob = doc.output("blob");

      // Get next version number
      const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;
      const fileName = `${contractNumber}_v${nextVersion}.pdf`;
      const filePath = `${contractId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("contract-pdfs")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create version record
      const { error: versionError } = await supabase
        .from("contract_versions")
        .insert({
          contract_id: contractId,
          version_number: nextVersion,
          file_path: filePath,
          generated_by: user?.id,
        });

      if (versionError) throw versionError;

      toast({
        title: "PDF Generated",
        description: `Version ${nextVersion} created successfully`,
      });

      fetchVersions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = async (version: ContractVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from("contract-pdfs")
        .download(version.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${contractNumber}_v${version.version_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const previewPDF = async (version: ContractVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from("contract-pdfs")
        .download(version.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
      setCurrentPreviewVersion(version);
      setIsPreviewOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to preview PDF",
        variant: "destructive",
      });
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setCurrentPreviewVersion(null);
    setIsPreviewOpen(false);
  };

  const openEmailDialog = (version: ContractVersion) => {
    setSelectedVersion(version);
    setEmailAddress(clientData?.general_email || clientData?.primary_contact_email || "");
    setShowEmailDialog(true);
  };

  const sendEmail = async () => {
    if (!selectedVersion || !emailAddress) {
      toast({
        title: "Error",
        description: "Please provide an email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke("send-contract-email", {
        body: {
          contractNumber,
          versionId: selectedVersion.id,
          clientEmail: emailAddress,
          clientName: clientData?.name || "Client",
          filePath: selectedVersion.file_path,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Contract PDF sent to ${emailAddress}`,
      });

      // Refresh email history for this version
      await fetchEmailHistory(selectedVersion.id);
      
      setShowEmailDialog(false);
    } catch (error: any) {
      console.error("Email error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <FileText className="w-6 h-6 text-primary" />
            PDF Versions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and manage contract PDF documents
          </p>
        </div>
        <Button 
          onClick={generatePDF} 
          disabled={isGenerating}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generate New PDF
            </>
          )}
        </Button>
      </div>

      {versions.length > 0 ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Version</TableHead>
                <TableHead className="font-semibold">Generated Date</TableHead>
                <TableHead className="font-semibold">Generated By</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version, index) => (
                <>
                  <TableRow 
                    key={version.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {version.version_number}
                          </span>
                        </div>
                        <span>Version {version.version_number}</span>
                        {index === 0 && (
                          <Badge variant="secondary" className="ml-2">Latest</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <span>
                          {new Date(version.generated_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {emailHistory[version.id]?.length > 0 && (
                          <Collapsible
                            open={expandedVersions[version.id]}
                            onOpenChange={(open) => 
                              setExpandedVersions(prev => ({ ...prev, [version.id]: open }))
                            }
                          >
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 text-xs p-0 hover:bg-transparent">
                                <History className="w-3 h-3 mr-1" />
                                {emailHistory[version.id].length} email{emailHistory[version.id].length !== 1 ? 's' : ''} sent
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {version.profiles?.full_name || version.profiles?.email || "Unknown"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => previewPDF(version)}
                        className="mr-2"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEmailDialog(version)}
                        className="mr-2"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => downloadPDF(version)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedVersions[version.id] && emailHistory[version.id]?.length > 0 && (
                    <TableRow key={`${version.id}-history`}>
                      <TableCell colSpan={3} className="bg-muted/20 p-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Sending History
                          </h4>
                          <div className="space-y-2">
                            {emailHistory[version.id].map((history) => (
                              <div 
                                key={history.id} 
                                className="flex items-center justify-between text-sm bg-background p-3 rounded-md border border-border"
                              >
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline" className="text-xs">
                                    {history.status}
                                  </Badge>
                                  <span className="text-muted-foreground">
                                    Sent to: <span className="text-foreground font-medium">{history.sent_to}</span>
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(history.sent_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2 text-foreground">No PDF versions yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first PDF version to share with clients
          </p>
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold">PDF Preview</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentPreviewVersion) {
                      downloadPDF(currentPreviewVersion);
                    }
                  }}
                  disabled={!currentPreviewVersion}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-muted/10 p-4 overflow-hidden">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg shadow-lg border border-border bg-background"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Contract via Email</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the email address where you want to send this contract PDF.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="client@example.com"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingEmail}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={sendEmail}
              disabled={isSendingEmail || !emailAddress}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
