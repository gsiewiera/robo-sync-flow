import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useCompanyLogo = () => {
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const { data } = await supabase
        .from("company_info")
        .select("logo_path")
        .limit(1)
        .maybeSingle();

      if (data?.logo_path) {
        const { data: urlData } = supabase.storage
          .from("company-logos")
          .getPublicUrl(data.logo_path);
        setCompanyLogo(urlData.publicUrl);
      }
    };

    fetchLogo();
  }, []);

  return companyLogo;
};
