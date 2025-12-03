import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Image, Trash2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ServiceTicketDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  notes: string | null;
  created_at: string;
}

interface ServiceTicketDocumentsProps {
  ticketId: string;
}

const CATEGORIES = ["general", "photo", "diagnostic", "repair", "invoice", "other"];

export const ServiceTicketDocuments = ({ ticketId }: ServiceTicketDocumentsProps) => {
  const [documents, setDocuments] = useState<ServiceTicketDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, [ticketId]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("service_ticket_documents")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return;
    }
    setDocuments(data || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      for (const file of Array.from(files)) {
        const filePath = `${ticketId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("service-ticket-documents")
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { error: dbError } = await supabase
          .from("service_ticket_documents")
          .insert({
            ticket_id: ticketId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            category: selectedCategory,
            notes: notes || null,
            uploaded_by: user?.id,
          });

        if (dbError) {
          toast.error(`Failed to save ${file.name} metadata`);
          continue;
        }

        toast.success(`Uploaded ${file.name}`);
      }

      fetchDocuments();
      setIsDialogOpen(false);
      setNotes("");
      setSelectedCategory("general");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: ServiceTicketDocument) => {
    const { error: storageError } = await supabase.storage
      .from("service-ticket-documents")
      .remove([doc.file_path]);

    if (storageError) {
      toast.error("Failed to delete file");
      return;
    }

    const { error: dbError } = await supabase
      .from("service_ticket_documents")
      .delete()
      .eq("id", doc.id);

    if (dbError) {
      toast.error("Failed to delete record");
      return;
    }

    toast.success("Document deleted");
    fetchDocuments();
  };

  const handleDownload = async (doc: ServiceTicketDocument) => {
    const { data } = supabase.storage
      .from("service-ticket-documents")
      .getPublicUrl(doc.file_path);

    window.open(data.publicUrl, "_blank");
  };

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.startsWith("image/")) {
      return <Image className="w-5 h-5 text-primary" />;
    }
    return <FileText className="w-5 h-5 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Documents & Files</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this file..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Select Files</Label>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="mt-1"
                />
              </div>
              {isUploading && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getFileIcon(doc.file_type)}
              <div>
                <p className="font-medium text-sm">{doc.file_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{doc.category}</span>
                  <span>•</span>
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>
                {doc.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(doc)}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(doc)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents uploaded</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload photos, diagnostic reports, or other files
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
