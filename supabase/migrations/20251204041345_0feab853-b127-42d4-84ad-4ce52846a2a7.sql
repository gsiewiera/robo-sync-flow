-- Create a generic function to prevent deletion when dependencies exist
CREATE OR REPLACE FUNCTION public.prevent_delete_if_dependencies()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
  dep_table TEXT;
  dep_column TEXT;
  dep_info TEXT[];
  i INTEGER;
BEGIN
  -- Get dependency info from trigger arguments
  -- Arguments are passed as pairs: table_name, column_name
  FOR i IN 0..(TG_NARGS - 1) BY 2 LOOP
    dep_table := TG_ARGV[i];
    dep_column := TG_ARGV[i + 1];
    
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', dep_table, dep_column)
    INTO dep_count
    USING OLD.id;
    
    IF dep_count > 0 THEN
      RAISE EXCEPTION 'Cannot delete: % record(s) in % are linked to this item', dep_count, dep_table
        USING ERRCODE = 'foreign_key_violation';
    END IF;
  END LOOP;
  
  RETURN OLD;
END;
$$;

-- Trigger for manufacturer_dictionary
CREATE OR REPLACE TRIGGER prevent_manufacturer_delete
BEFORE DELETE ON public.manufacturer_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('robot_model_dictionary', 'manufacturer');

-- Trigger for robot_type_dictionary
CREATE OR REPLACE TRIGGER prevent_robot_type_delete
BEFORE DELETE ON public.robot_type_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('robot_model_dictionary', 'type');

-- Trigger for client_type_dictionary
CREATE OR REPLACE TRIGGER prevent_client_type_delete
BEFORE DELETE ON public.client_type_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('client_client_types', 'client_type_id');

-- Trigger for market_dictionary
CREATE OR REPLACE TRIGGER prevent_market_delete
BEFORE DELETE ON public.market_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('client_markets', 'market_id');

-- Trigger for segment_dictionary
CREATE OR REPLACE TRIGGER prevent_segment_delete
BEFORE DELETE ON public.segment_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('client_segments', 'segment_id');

-- Trigger for client_size_dictionary
CREATE OR REPLACE TRIGGER prevent_client_size_delete
BEFORE DELETE ON public.client_size_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('client_sizes', 'size_id');

-- Trigger for lease_month_dictionary
CREATE OR REPLACE TRIGGER prevent_lease_month_delete
BEFORE DELETE ON public.lease_month_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('lease_pricing', 'months');

-- Trigger for document_category_dictionary
CREATE OR REPLACE TRIGGER prevent_document_category_delete
BEFORE DELETE ON public.document_category_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('client_documents', 'category', 'robot_documents', 'category', 'robot_model_documents', 'category');

-- Trigger for client_categories
CREATE OR REPLACE TRIGGER prevent_client_category_delete
BEFORE DELETE ON public.client_categories
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('client_tags', 'category_id');

-- Trigger for client_tags
CREATE OR REPLACE TRIGGER prevent_client_tag_delete
BEFORE DELETE ON public.client_tags
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('client_assigned_tags', 'tag_id');

-- Trigger for email_templates
CREATE OR REPLACE TRIGGER prevent_email_template_delete
BEFORE DELETE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_if_dependencies('campaign_mailings', 'template_id');

-- Create a more specific function for clients with multiple dependency tables
CREATE OR REPLACE FUNCTION public.prevent_client_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
  total_deps INTEGER := 0;
  dep_details TEXT := '';
BEGIN
  -- Check notes
  SELECT COUNT(*) INTO dep_count FROM notes WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' notes, ';
  END IF;
  
  -- Check offers
  SELECT COUNT(*) INTO dep_count FROM offers WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' offers, ';
  END IF;
  
  -- Check contracts
  SELECT COUNT(*) INTO dep_count FROM contracts WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' contracts, ';
  END IF;
  
  -- Check invoices
  SELECT COUNT(*) INTO dep_count FROM invoices WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' invoices, ';
  END IF;
  
  -- Check payments
  SELECT COUNT(*) INTO dep_count FROM payments WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' payments, ';
  END IF;
  
  -- Check robots
  SELECT COUNT(*) INTO dep_count FROM robots WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' robots, ';
  END IF;
  
  -- Check service_tickets
  SELECT COUNT(*) INTO dep_count FROM service_tickets WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' service tickets, ';
  END IF;
  
  -- Check tasks
  SELECT COUNT(*) INTO dep_count FROM tasks WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' tasks, ';
  END IF;
  
  -- Check campaign_clients
  SELECT COUNT(*) INTO dep_count FROM campaign_clients WHERE client_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' campaign associations, ';
  END IF;
  
  IF total_deps > 0 THEN
    dep_details := rtrim(dep_details, ', ');
    RAISE EXCEPTION 'Cannot delete client: has linked records (%)' , dep_details
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for clients
CREATE OR REPLACE TRIGGER prevent_client_delete
BEFORE DELETE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.prevent_client_delete();

-- Function for robot_model_dictionary
CREATE OR REPLACE FUNCTION public.prevent_robot_model_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
  total_deps INTEGER := 0;
  dep_details TEXT := '';
BEGIN
  -- Check robots
  SELECT COUNT(*) INTO dep_count FROM robots WHERE model = OLD.model_name;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' robots, ';
  END IF;
  
  -- Check robot_pricing
  SELECT COUNT(*) INTO dep_count FROM robot_pricing WHERE robot_model = OLD.model_name;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' pricing entries, ';
  END IF;
  
  -- Check offer_items
  SELECT COUNT(*) INTO dep_count FROM offer_items WHERE robot_model = OLD.model_name;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' offer items, ';
  END IF;
  
  -- Check robot_model_documents
  SELECT COUNT(*) INTO dep_count FROM robot_model_documents WHERE robot_model_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' documents, ';
  END IF;
  
  IF total_deps > 0 THEN
    dep_details := rtrim(dep_details, ', ');
    RAISE EXCEPTION 'Cannot delete robot model: has linked records (%)', dep_details
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for robot_model_dictionary
CREATE OR REPLACE TRIGGER prevent_robot_model_delete
BEFORE DELETE ON public.robot_model_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.prevent_robot_model_delete();

-- Function for resellers
CREATE OR REPLACE FUNCTION public.prevent_reseller_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
  total_deps INTEGER := 0;
  dep_details TEXT := '';
BEGIN
  -- Check clients
  SELECT COUNT(*) INTO dep_count FROM clients WHERE reseller_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' clients, ';
  END IF;
  
  -- Check contracts
  SELECT COUNT(*) INTO dep_count FROM contracts WHERE reseller_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' contracts, ';
  END IF;
  
  -- Check offers
  SELECT COUNT(*) INTO dep_count FROM offers WHERE reseller_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' offers, ';
  END IF;
  
  IF total_deps > 0 THEN
    dep_details := rtrim(dep_details, ', ');
    RAISE EXCEPTION 'Cannot delete reseller: has linked records (%)', dep_details
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for resellers
CREATE OR REPLACE TRIGGER prevent_reseller_delete
BEFORE DELETE ON public.resellers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_reseller_delete();

-- Function for campaigns
CREATE OR REPLACE FUNCTION public.prevent_campaign_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
BEGIN
  -- Check campaign_mailings
  SELECT COUNT(*) INTO dep_count FROM campaign_mailings WHERE campaign_id = OLD.id;
  IF dep_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete campaign: has % mailing(s) linked', dep_count
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  -- Check campaign_clients
  SELECT COUNT(*) INTO dep_count FROM campaign_clients WHERE campaign_id = OLD.id;
  IF dep_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete campaign: has % client(s) linked', dep_count
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for campaigns
CREATE OR REPLACE TRIGGER prevent_campaign_delete
BEFORE DELETE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.prevent_campaign_delete();

-- Function for contracts
CREATE OR REPLACE FUNCTION public.prevent_contract_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
  total_deps INTEGER := 0;
  dep_details TEXT := '';
BEGIN
  -- Check contract_robots
  SELECT COUNT(*) INTO dep_count FROM contract_robots WHERE contract_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' robots, ';
  END IF;
  
  -- Check contract_versions
  SELECT COUNT(*) INTO dep_count FROM contract_versions WHERE contract_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' versions, ';
  END IF;
  
  IF total_deps > 0 THEN
    dep_details := rtrim(dep_details, ', ');
    RAISE EXCEPTION 'Cannot delete contract: has linked records (%)', dep_details
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for contracts
CREATE OR REPLACE TRIGGER prevent_contract_delete
BEFORE DELETE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_contract_delete();

-- Function for robots
CREATE OR REPLACE FUNCTION public.prevent_robot_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
  total_deps INTEGER := 0;
  dep_details TEXT := '';
BEGIN
  -- Check service_tickets
  SELECT COUNT(*) INTO dep_count FROM service_tickets WHERE robot_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' service tickets, ';
  END IF;
  
  -- Check contract_robots
  SELECT COUNT(*) INTO dep_count FROM contract_robots WHERE robot_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' contract links, ';
  END IF;
  
  -- Check robot_documents
  SELECT COUNT(*) INTO dep_count FROM robot_documents WHERE robot_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' documents, ';
  END IF;
  
  IF total_deps > 0 THEN
    dep_details := rtrim(dep_details, ', ');
    RAISE EXCEPTION 'Cannot delete robot: has linked records (%)', dep_details
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for robots
CREATE OR REPLACE TRIGGER prevent_robot_delete
BEFORE DELETE ON public.robots
FOR EACH ROW
EXECUTE FUNCTION public.prevent_robot_delete();

-- Function for offers
CREATE OR REPLACE FUNCTION public.prevent_offer_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dep_count INTEGER;
  total_deps INTEGER := 0;
  dep_details TEXT := '';
BEGIN
  -- Check offer_items
  SELECT COUNT(*) INTO dep_count FROM offer_items WHERE offer_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' items, ';
  END IF;
  
  -- Check offer_versions
  SELECT COUNT(*) INTO dep_count FROM offer_versions WHERE offer_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' versions, ';
  END IF;
  
  -- Check notes
  SELECT COUNT(*) INTO dep_count FROM notes WHERE offer_id = OLD.id;
  IF dep_count > 0 THEN
    total_deps := total_deps + dep_count;
    dep_details := dep_details || dep_count || ' notes, ';
  END IF;
  
  IF total_deps > 0 THEN
    dep_details := rtrim(dep_details, ', ');
    RAISE EXCEPTION 'Cannot delete offer: has linked records (%)', dep_details
      USING ERRCODE = 'foreign_key_violation';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Trigger for offers
CREATE OR REPLACE TRIGGER prevent_offer_delete
BEFORE DELETE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.prevent_offer_delete();