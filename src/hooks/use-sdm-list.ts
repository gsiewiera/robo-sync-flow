import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string;
}

export const useSdmList = (enabled = true) => {
  const [sdmList, setSdmList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      setLoading(true);
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "service_delivery_manager");

      if (roleData && roleData.length > 0) {
        const userIds = roleData.map((r) => r.user_id);
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds)
          .order("full_name");

        setSdmList(data || []);
      } else {
        setSdmList([]);
      }
      setLoading(false);
    };

    fetch();
  }, [enabled]);

  return { sdmList, loading };
};
