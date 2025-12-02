import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Eye, Mail } from "lucide-react";
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

interface OfferVersion {
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

interface OfferPdfGeneratorProps {
  offerId: string;
  offerNumber: string;
  offerData: any;
  clientData: any;
  itemsData: any[];
}

export const OfferPdfGenerator = ({
  offerId,
  offerNumber,
  offerData,
  clientData,
  itemsData,
}: OfferPdfGeneratorProps) => {
  const [versions, setVersions] = useState<OfferVersion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPreviewVersion, setCurrentPreviewVersion] = useState<OfferVersion | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<OfferVersion | null>(null);
  const [emailAddress, setEmailAddress] = useState(clientData?.general_email || "");
  const { toast } = useToast();


  useEffect(() => {
    fetchVersions();
  }, [offerId]);

  const fetchVersions = async () => {
    console.log("Fetching versions for offer:", offerId);
    const { data, error } = await supabase
      .from("offer_versions")
      .select("*, profiles:generated_by(full_name, email)")
      .eq("offer_id", offerId)
      .order("version_number", { ascending: false });

    console.log("Fetch versions result:", { data, error });
    
    if (error) {
      console.error("Error fetching versions:", error);
      toast({
        title: "Error",
        description: "Failed to load PDF versions",
        variant: "destructive",
      });
      return;
    }
    
    if (data) {
      setVersions(data as any);
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Fetch template settings
      const { data: templateData } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "pdf_company_name",
          "pdf_company_address",
          "pdf_company_phone",
          "pdf_company_email",
          "pdf_primary_color",
          "pdf_header_text",
          "pdf_footer_text",
          "pdf_terms_conditions",
          "pdf_preset",
        ]);

      const template: any = {};
      templateData?.forEach((item) => {
        const key = item.key.replace("pdf_", "");
        template[key] = item.value;
      });

      // Get preset configuration
      const presetKey = template.preset || "modern";
      const PRESETS = {
        modern: { font_size_title: 24, font_size_header: 14, font_size_body: 10 },
        classic: { font_size_title: 20, font_size_header: 12, font_size_body: 9 },
        minimal: { font_size_title: 18, font_size_header: 10, font_size_body: 8 },
      };
      const presetConfig = PRESETS[presetKey as keyof typeof PRESETS] || PRESETS.modern;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const primaryColor = template.primary_color || "#3b82f6";
      const hexToRgb = (hex: string): [number, number, number] => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? [
              parseInt(result[1], 16),
              parseInt(result[2], 16),
              parseInt(result[3], 16),
            ]
          : [59, 130, 246];
      };
      const rgb = hexToRgb(primaryColor);
      
      // Header with company info
      let yPos = 20;
      if (template.company_name) {
        doc.setFontSize(16);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text(template.company_name, 14, yPos);
        yPos += 7;
        doc.setTextColor(0, 0, 0);
      }

      doc.setFontSize(presetConfig.font_size_body);
      if (template.company_address) {
        doc.text(template.company_address, 14, yPos);
        yPos += 5;
      }
      if (template.company_phone) {
        doc.text(`Phone: ${template.company_phone}`, 14, yPos);
        yPos += 5;
      }
      if (template.company_email) {
        doc.text(`Email: ${template.company_email}`, 14, yPos);
        yPos += 5;
      }

      yPos += 10;
      doc.setFontSize(presetConfig.font_size_title);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text(template.header_text || "OFFER", pageWidth / 2, yPos, { align: "center" });
      doc.setTextColor(0, 0, 0);
      yPos += 15;
      
      doc.setFontSize(presetConfig.font_size_header);
      doc.text(`Offer Number: ${offerNumber}`, 14, yPos);
      yPos += 7;
      doc.text(`Date: ${new Date(offerData.created_at).toLocaleDateString()}`, 14, yPos);
      yPos += 7;
      doc.text(`Stage: ${offerData.stage?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'N/A'}`, 14, yPos);
      yPos += 10;

      // Client Information
      doc.setFontSize(presetConfig.font_size_header);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text("Client Information", 14, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 8;
      doc.setFontSize(presetConfig.font_size_body);
      doc.text(`Name: ${clientData?.name || "N/A"}`, 14, yPos);
      yPos += 7;
      if (clientData?.address) {
        doc.text(`Address: ${clientData.address}`, 14, yPos);
        yPos += 7;
      }
      if (clientData?.city) {
        doc.text(`City: ${clientData.city}`, 14, yPos);
        yPos += 7;
      }

      // Items Table
      const tableData = itemsData.map((item) => [
        item.robot_model,
        item.quantity.toString(),
        `${formatMoney(item.unit_price)} ${offerData.currency || "PLN"}`,
        `${formatMoney(item.quantity * item.unit_price)} ${offerData.currency || "PLN"}`,
      ]);

      autoTable(doc, {
        startY: yPos + 5,
        head: [["Robot Model", "Quantity", "Unit Price", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: rgb },
      });

      // Totals
      const finalY = (doc as any).lastAutoTable.finalY || 95;
      const subtotal = itemsData.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      
      doc.setFontSize(presetConfig.font_size_header);
      doc.text(`Subtotal: ${formatMoney(subtotal)} ${offerData.currency || "PLN"}`, pageWidth - 14, finalY + 15, { align: "right" });
      
      if (offerData.total_price) {
        doc.setFontSize(presetConfig.font_size_header + 2);
        doc.text(`Total: ${formatMoney(offerData.total_price)} ${offerData.currency || "PLN"}`, pageWidth - 14, finalY + 25, { align: "right" });
      }

      // Notes
      let notesY = finalY + 40;
      if (offerData.notes) {
        doc.setFontSize(presetConfig.font_size_body);
        doc.text("Notes:", 14, notesY);
        const splitNotes = doc.splitTextToSize(offerData.notes, pageWidth - 28);
        doc.text(splitNotes, 14, notesY + 7);
        notesY += 7 + splitNotes.length * 5 + 10;
      }

      // Terms and conditions
      if (template.terms_conditions) {
        doc.setFontSize(presetConfig.font_size_body);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text("Terms & Conditions:", 14, notesY);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(presetConfig.font_size_body - 1);
        const splitTerms = doc.splitTextToSize(template.terms_conditions, pageWidth - 28);
        doc.text(splitTerms, 14, notesY + 7);
        notesY += 7 + splitTerms.length * 4 + 10;
      }

      // Footer
      if (template.footer_text) {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(presetConfig.font_size_body);
        doc.setTextColor(100, 100, 100);
        doc.text(template.footer_text, pageWidth / 2, pageHeight - 15, { align: "center" });
        doc.setTextColor(0, 0, 0);
      }

      // Convert PDF to blob
      const pdfBlob = doc.output("blob");
      
      // Get next version number directly from database to avoid race conditions
      const { data: existingVersions } = await supabase
        .from("offer_versions")
        .select("version_number")
        .eq("offer_id", offerId)
        .order("version_number", { ascending: false })
        .limit(1);
      
      const nextVersion = existingVersions && existingVersions.length > 0 
        ? existingVersions[0].version_number + 1 
        : 1;
      const fileName = `${offerNumber}_v${nextVersion}.pdf`;
      const filePath = `${offerId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("offer-pdfs")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create version record
      const { error: versionError } = await supabase
        .from("offer_versions")
        .insert({
          offer_id: offerId,
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

  const downloadPDF = async (version: OfferVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from("offer-pdfs")
        .download(version.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${offerNumber}_v${version.version_number}.pdf`;
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

  const previewPDF = async (version: OfferVersion) => {
    try {
      const { data, error } = await supabase.storage
        .from("offer-pdfs")
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

  const openEmailDialog = (version: OfferVersion) => {
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
      const { error } = await supabase.functions.invoke("send-offer-email", {
        body: {
          offerNumber,
          versionId: selectedVersion.id,
          clientEmail: emailAddress,
          clientName: clientData?.name || "Client",
          filePath: selectedVersion.file_path,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Offer PDF sent to ${emailAddress}`,
      });

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
            Generate and manage offer PDF documents
          </p>
        </div>
        <Button 
          onClick={generatePDF} 
          disabled={isGenerating}
          size="lg"
          className="shadow-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generate offer
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
                    {new Date(version.generated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {version.profiles?.full_name || version.profiles?.email || "Unknown"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      key={`preview-${version.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => previewPDF(version)}
                      className="mr-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      key={`email-${version.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => openEmailDialog(version)}
                      className="mr-2"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      key={`download-${version.id}`}
                      variant="default"
                      size="sm"
                      onClick={() => downloadPDF(version)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
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
          <Button onClick={generatePDF} disabled={isGenerating} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Generate First PDF
          </Button>
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
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
            <AlertDialogTitle>Send Offer via Email</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the email address where you want to send this offer PDF.
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