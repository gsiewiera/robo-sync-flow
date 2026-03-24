import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientTag {
  id: string;
  name: string;
  color: string | null;
  category_id: string | null;
}

export const useClientTags = (enabled = true) => {
  const [tags, setTags] = useState<ClientTag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("client_tags")
      .select("*")
      .order("name");
    setTags(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchTags();
  }, [enabled, fetchTags]);

  return { tags, loading, refetch: fetchTags };
};
