import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  name: string;
  primary_contact_name?: string;
}

export const useClients = (enabled = true) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("clients")
        .select("id, name, primary_contact_name")
        .order("name");
      setClients(data || []);
      setLoading(false);
    };

    fetch();
  }, [enabled]);

  return { clients, loading };
};
