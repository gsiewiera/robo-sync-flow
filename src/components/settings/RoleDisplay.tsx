import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const RoleDisplay = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (userRoles) {
      setRoles(userRoles.map((r) => r.role));
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Roles</CardTitle>
        <CardDescription>View your assigned roles and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading roles...</p>
        ) : roles.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {roles.map((role) => (
              <Badge key={role} variant="secondary" className="capitalize">
                {role}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No roles assigned yet. Contact your administrator.</p>
        )}
      </CardContent>
    </Card>
  );
};
