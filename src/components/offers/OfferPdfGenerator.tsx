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
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Header
      doc.setFontSize(20);
      doc.text("OFFER", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`Offer Number: ${offerNumber}`, 14, 35);
      doc.text(`Date: ${new Date(offerData.created_at).toLocaleDateString()}`, 14, 42);
      doc.text(`Status: ${offerData.status.toUpperCase()}`, 14, 49);

      // Client Information
      doc.setFontSize(14);
      doc.text("Client Information", 14, 62);
      doc.setFontSize(10);
      doc.text(`Name: ${clientData?.name || "N/A"}`, 14, 70);
      if (clientData?.address) doc.text(`Address: ${clientData.address}`, 14, 77);
      if (clientData?.city) doc.text(`City: ${clientData.city}`, 14, 84);

      // Items Table
      const tableData = itemsData.map((item) => [
        item.robot_model,
        item.quantity.toString(),
        `${item.unit_price.toFixed(2)} ${offerData.currency || "PLN"}`,
        `${(item.quantity * item.unit_price).toFixed(2)} ${offerData.currency || "PLN"}`,
      ]);

      autoTable(doc, {
        startY: 95,
        head: [["Robot Model", "Quantity", "Unit Price", "Total"]],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246] },
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
      if (offerData.notes) {
        doc.setFontSize(10);
        doc.text("Notes:", 14, finalY + 40);
        const splitNotes = doc.splitTextToSize(offerData.notes, pageWidth - 28);
        doc.text(splitNotes, 14, finalY + 47);
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