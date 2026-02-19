import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string;
}

export const useSalespeople = (enabled = true) => {
  const [salespeople, setSalespeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      setSalespeople(data || []);
      setLoading(false);
    };

    fetch();
  }, [enabled]);

  return { salespeople, loading };
};
