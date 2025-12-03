import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { ArrowLeft, Pencil, Cpu, Save, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RobotModelPricing } from "@/components/robot-models/RobotModelPricing";
import { RobotModelUnits } from "@/components/robot-models/RobotModelUnits";
import { RobotModelStock } from "@/components/robot-models/RobotModelStock";
import { RobotModelDocuments } from "@/components/robot-models/RobotModelDocuments";

const formSchema = z.object({
  model_name: z.string().min(1, "Model name is required").max(100),
  manufacturer: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  description: z.string().max(500).optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface RobotModel {
  id: string;
  model_name: string;
  type: string | null;
  manufacturer: string | null;
  description: string | null;
  is_active: boolean;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

const RobotModelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<RobotModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [robotTypes, setRobotTypes] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_name: "",
      manufacturer: "",
      type: "",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    checkAdminRole();
    fetchModel();
    fetchManufacturers();
    fetchRobotTypes();
  }, [id]);

  useEffect(() => {
    if (model) {
      form.reset({
        model_name: model.model_name,
        manufacturer: model.manufacturer || "",
        type: model.type || "",
        description: model.description || "",
        is_active: model.is_active,
      });
      if (model.image_path) {
        const { data } = supabase.storage
          .from("robot-model-images")
          .getPublicUrl(model.image_path);
        setImagePreview(data.publicUrl);
      } else {
        setImagePreview(null);
      }
    }
  }, [model, form]);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = userRoles?.some((r) => r.role === "admin");
    setIsAdmin(hasAdminRole || false);
  };

  const fetchModel = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("robot_model_dictionary")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching robot model:", error);
      toast.error("Failed to load robot model");
    } else if (!data) {
      toast.error("Robot model not found");
      navigate("/robot-models");
    } else {
      setModel(data);
    }
    setLoading(false);
  };

  const fetchManufacturers = async () => {
    const { data } = await supabase
      .from("manufacturer_dictionary")
      .select("manufacturer_name")
      .order("manufacturer_name");
    if (data) {
      setManufacturers(data.map((m) => m.manufacturer_name));
    }
  };

  const fetchRobotTypes = async () => {
    const { data } = await supabase
      .from("robot_type_dictionary")
      .select("type_name")
      .order("type_name");
    if (data) {
      setRobotTypes(data.map((t) => t.type_name));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !model) return model?.image_path || null;

    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${model.id}-${Date.now()}.${fileExt}`;

    if (model.image_path) {
      await supabase.storage.from("robot-model-images").remove([model.image_path]);
    }

    const { error } = await supabase.storage
      .from("robot-model-images")
      .upload(fileName, imageFile);

    if (error) {
      console.error("Error uploading image:", error);
      return model.image_path;
    }

    return fileName;
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    if (model) {
      form.reset({
        model_name: model.model_name,
        manufacturer: model.manufacturer || "",
        type: model.type || "",
        description: model.description || "",
        is_active: model.is_active,
      });
      if (model.image_path) {
        const { data } = supabase.storage
          .from("robot-model-images")
          .getPublicUrl(model.image_path);
        setImagePreview(data.publicUrl);
      } else {
        setImagePreview(null);
      }
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!model) return;
    
    setSaving(true);
    const imagePath = await uploadImage();

    const { error } = await supabase
      .from("robot_model_dictionary")
      .update({
        model_name: values.model_name.trim(),
        manufacturer: values.manufacturer?.trim() || null,
        type: values.type,
        description: values.description?.trim() || null,
        is_active: values.is_active,
        image_path: imagePath,
      })
      .eq("id", model.id);

    setSaving(false);

    if (error) {
      console.error("Error saving robot model:", error);
      if (error.code === "23505") {
        toast.error("A model with this name already exists");
      } else {
        toast.error("Failed to save robot model");
      }
      return;
    }

    toast.success("Robot model updated successfully");
    setIsEditing(false);
    setImageFile(null);
    fetchModel();
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </Layout>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/robot-models")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-2xl font-semibold">{model.model_name}</h1>
            </div>
            <Badge variant={model.is_active ? "default" : "secondary"}>
              {model.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {isAdmin && !isEditing && (
            <Button size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={form.handleSubmit(onSubmit)} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <Form {...form}>
            <form className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">General Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="model_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {robotTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select manufacturer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {manufacturers.map((mfr) => (
                              <SelectItem key={mfr} value={mfr}>
                                {mfr}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <FormLabel>Image</FormLabel>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={removeImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-48 flex flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to upload image</span>
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription className="text-xs">
                            Inactive models won't appear in dropdowns
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Model Name</p>
                    <p className="font-medium">{model.model_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{model.type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Manufacturer</p>
                    <p className="font-medium">{model.manufacturer || "-"}</p>
                  </div>
                </div>
                {model.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{model.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                {model.image_path ? (
                  <div className="w-full h-48 rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={supabase.storage.from("robot-model-images").getPublicUrl(model.image_path).data.publicUrl}
                      alt={model.model_name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-lg border bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {model.is_active ? "Model is active" : "Model is inactive"}
                    </p>
                  </div>
                  <Badge variant={model.is_active ? "default" : "secondary"}>
                    {model.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Section */}
        <Tabs defaultValue="pricing" className="w-full">
          <TabsList>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="pricing" className="mt-4">
            <RobotModelPricing modelName={model.model_name} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="units" className="mt-4">
            <RobotModelUnits modelName={model.model_name} />
          </TabsContent>
          <TabsContent value="stock" className="mt-4">
            <RobotModelStock modelName={model.model_name} />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <RobotModelDocuments modelId={model.id} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RobotModelDetail;
