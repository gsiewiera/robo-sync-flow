import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Reseller {
  id: string;
  name: string;
}

export const useResellers = (enabled = true) => {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("resellers")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      setResellers(data || []);
      setLoading(false);
    };

    fetch();
  }, [enabled]);

  return { resellers, loading };
};
