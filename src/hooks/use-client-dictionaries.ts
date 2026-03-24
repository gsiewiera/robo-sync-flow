import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DictionaryItem {
  id: string;
  name: string;
}

export const useClientDictionaries = (enabled = true) => {
  const [clientTypes, setClientTypes] = useState<DictionaryItem[]>([]);
  const [markets, setMarkets] = useState<DictionaryItem[]>([]);
  const [segments, setSegments] = useState<DictionaryItem[]>([]);
  const [clientSizes, setClientSizes] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const fetch = async () => {
      setLoading(true);
      const [typesRes, marketsRes, segmentsRes, sizesRes] = await Promise.all([
        supabase.from("client_type_dictionary").select("id, name").order("name"),
        supabase.from("market_dictionary").select("id, name").order("name"),
        supabase.from("segment_dictionary").select("id, name").order("name"),
        supabase.from("client_size_dictionary").select("id, name").order("name"),
      ]);

      if (typesRes.data) setClientTypes(typesRes.data);
      if (marketsRes.data) setMarkets(marketsRes.data);
      if (segmentsRes.data) setSegments(segmentsRes.data);
      if (sizesRes.data) setClientSizes(sizesRes.data);
      setLoading(false);
    };

    fetch();
  }, [enabled]);

  return { clientTypes, markets, segments, clientSizes, loading };
};
