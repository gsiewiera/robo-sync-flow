import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface OfferVersion {
  id: string;
  version_number: number;
  file_path: string;
  generated_at: string;
  generated_by: string;
  notes: string | null;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();
  }, [offerId]);

  const fetchVersions = async () => {
    const { data, error } = await supabase
      .from("offer_versions")
      .select("*")
      .eq("offer_id", offerId)
      .order("version_number", { ascending: false });

    if (!error && data) {
      setVersions(data);
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
        ]);

      const template: any = {};
      templateData?.forEach((item) => {
        const key = item.key.replace("pdf_", "");
        template[key] = item.value;
      });

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

      doc.setFontSize(9);
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
      doc.setFontSize(20);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text(template.header_text || "OFFER", pageWidth / 2, yPos, { align: "center" });
      doc.setTextColor(0, 0, 0);
      yPos += 15;
      
      doc.setFontSize(12);
      doc.text(`Offer Number: ${offerNumber}`, 14, yPos);
      yPos += 7;
      doc.text(`Date: ${new Date(offerData.created_at).toLocaleDateString()}`, 14, yPos);
      yPos += 7;
      doc.text(`Status: ${offerData.status.toUpperCase()}`, 14, yPos);
      yPos += 10;

      // Client Information
      doc.setFontSize(14);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
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
      if (clientData?.city) {
        doc.text(`City: ${clientData.city}`, 14, yPos);
        yPos += 7;
      }

      // Items Table
      const tableData = itemsData.map((item) => [
        item.robot_model,
        item.quantity.toString(),
        `${item.unit_price.toFixed(2)} ${offerData.currency || "PLN"}`,
        `${(item.quantity * item.unit_price).toFixed(2)} ${offerData.currency || "PLN"}`,
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
      
      doc.setFontSize(12);
      doc.text(`Subtotal: ${subtotal.toFixed(2)} ${offerData.currency || "PLN"}`, pageWidth - 14, finalY + 15, { align: "right" });
      
      if (offerData.total_price) {
        doc.setFontSize(14);
        doc.text(`Total: ${offerData.total_price.toFixed(2)} ${offerData.currency || "PLN"}`, pageWidth - 14, finalY + 25, { align: "right" });
      }

      // Notes
      let notesY = finalY + 40;
      if (offerData.notes) {
        doc.setFontSize(10);
        doc.text("Notes:", 14, notesY);
        const splitNotes = doc.splitTextToSize(offerData.notes, pageWidth - 28);
        doc.text(splitNotes, 14, notesY + 7);
        notesY += 7 + splitNotes.length * 5 + 10;
      }

      // Terms and conditions
      if (template.terms_conditions) {
        doc.setFontSize(10);
        doc.setTextColor(rgb[0], rgb[1], rgb[2]);
        doc.text("Terms & Conditions:", 14, notesY);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        const splitTerms = doc.splitTextToSize(template.terms_conditions, pageWidth - 28);
        doc.text(splitTerms, 14, notesY + 7);
        notesY += 7 + splitTerms.length * 4 + 10;
      }

      // Footer
      if (template.footer_text) {
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(template.footer_text, pageWidth / 2, pageHeight - 15, { align: "center" });
        doc.setTextColor(0, 0, 0);
      }

      // Convert PDF to blob
      const pdfBlob = doc.output("blob");
      
      // Get next version number
      const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;
      const fileName = `${offerNumber}_v${nextVersion}.pdf`;
      const filePath = `${offerId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("offer-pdfs")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: false,
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
    setIsPreviewOpen(false);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          PDF Versions
        </h2>
        <Button onClick={generatePDF} disabled={isGenerating}>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.id}>
                <TableCell className="font-medium">v{version.version_number}</TableCell>
                <TableCell>
                  {new Date(version.generated_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previewPDF(version)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadPDF(version)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No PDF versions yet</p>
          <p className="text-sm text-muted-foreground">Click "Generate New PDF" to create the first version</p>
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>PDF Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-md"
              title="PDF Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};