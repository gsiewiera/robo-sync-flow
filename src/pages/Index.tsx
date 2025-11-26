import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bot } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-primary/10 rounded-full animate-pulse">
          <Bot className="w-12 h-12 text-primary" />
        </div>
        <p className="text-muted-foreground">Loading RoboCRM...</p>
      </div>
    </div>
  );
};

export default Index;
