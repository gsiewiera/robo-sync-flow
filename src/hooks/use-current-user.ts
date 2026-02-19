import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCurrentUser = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      setLoading(false);
    };
    fetch();
  }, []);

  return { userId, loading };
};
