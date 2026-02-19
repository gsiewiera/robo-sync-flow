import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRoles = () => {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (data) {
          setUserRoles(data.map((r) => r.role));
        }
      } catch (error) {
        console.error("Failed to fetch user roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return { userRoles, loading };
};
