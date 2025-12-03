import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  model_name: z.string().min(1, "Model name is required").max(100, "Model name must be less than 100 characters"),
  manufacturer: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface RobotModel {
  id: string;
  model_name: string;
  manufacturer: string | null;
  type: string | null;
  description: string | null;
  is_active: boolean;
}

interface RobotModelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: RobotModel | null;
  onSuccess: () => void;
}

const robotTypes = [
  "Delivery Robot",
  "Service Robot",
  "Cleaning Robot",
  "Hospitality Robot",
  "Industrial Robot",
  "Collaborative Robot",
];

export const RobotModelFormDialog = ({
  open,
  onOpenChange,
  model,
  onSuccess,
}: RobotModelFormDialogProps) => {
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model_name: "",
      manufacturer: "",
      type: "Delivery Robot",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    const { data } = await supabase
      .from("manufacturer_dictionary")
      .select("manufacturer_name")
      .order("manufacturer_name");
    if (data) {
      setManufacturers(data.map((m) => m.manufacturer_name));
    }
  };

  useEffect(() => {
    if (model) {
      form.reset({
        model_name: model.model_name,
        manufacturer: model.manufacturer || "",
        type: model.type || "Delivery Robot",
        description: model.description || "",
        is_active: model.is_active,
      });
    } else {
      form.reset({
        model_name: "",
        manufacturer: "",
        type: "Delivery Robot",
        description: "",
        is_active: true,
      });
    }
  }, [model, form]);

  const onSubmit = async (values: FormValues) => {
    const data = {
      model_name: values.model_name.trim(),
      manufacturer: values.manufacturer?.trim() || null,
      type: values.type,
      description: values.description?.trim() || null,
      is_active: values.is_active,
    };

    let error;

    if (model) {
      ({ error } = await supabase
        .from("robot_model_dictionary")
        .update(data)
        .eq("id", model.id));
    } else {
      ({ error } = await supabase
        .from("robot_model_dictionary")
        .insert([data]));
    }

    if (error) {
      console.error("Error saving robot model:", error);
      if (error.code === "23505") {
        toast.error("A model with this name already exists");
      } else {
        toast.error("Failed to save robot model");
      }
      return;
    }

    toast.success(`Robot model ${model ? "updated" : "created"} successfully`);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{model ? "Edit" : "New"} Robot Model</DialogTitle>
          <DialogDescription>
            {model ? "Update the robot model details" : "Add a new robot model"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="model_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BellaBot" {...field} />
                  </FormControl>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                {model ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};