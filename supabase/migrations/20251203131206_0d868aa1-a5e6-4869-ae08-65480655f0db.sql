-- Update the handle_new_user function to also assign a default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  -- Assign default role (salesperson) so users have basic access
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'salesperson');
  
  RETURN NEW;
END;
$$;