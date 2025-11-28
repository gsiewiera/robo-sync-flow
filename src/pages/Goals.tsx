import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Target, Plus, CalendarIcon, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  goal_type: string;
  target_value: number;
  current_value: number;
  period_type: string;
  start_date: string;
  end_date: string;
  is_team_goal: boolean;
  assigned_user_id: string | null;
  status: string;
  profiles: { full_name: string } | null;
}

interface UserOption {
  id: string;
  full_name: string;
}

const GOAL_TYPES = [
  { value: "revenue", label: "Total Revenue" },
  { value: "deals_won", label: "Deals Won" },
  { value: "conversion_rate", label: "Conversion Rate" },
  { value: "tasks_completed", label: "Tasks Completed" },
  { value: "clients_acquired", label: "Clients Acquired" },
  { value: "average_deal_size", label: "Average Deal Size" },
];

const PERIOD_TYPES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export default function Goals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [periodType, setPeriodType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isTeamGoal, setIsTeamGoal] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "manager"]);

    if (!roleData || roleData.length === 0) {
      toast.error("Access denied. Manager or Admin privileges required.");
      navigate("/");
      return;
    }

    setHasAccess(true);
    fetchGoals();
    fetchUsers();
  };

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("performance_goals")
        .select(`
          *,
          profiles:assigned_user_id(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data as any || []);
    } catch (error: any) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id, profiles!inner(id, full_name)")
        .in("role", ["salesperson", "manager"]);

      if (rolesData) {
        const uniqueUsers = Array.from(
          new Map(
            rolesData.map((r: any) => [r.profiles.id, r.profiles])
          ).values()
        );
        setUsers(uniqueUsers as UserOption[]);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateGoal = async () => {
    if (!title || !goalType || !targetValue || !periodType || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isTeamGoal && !assignedUserId) {
      toast.error("Please select a user or make it a team goal");
      return;
    }

    try {
      const { error } = await supabase
        .from("performance_goals")
        .insert({
          title,
          description: description || null,
          goal_type: goalType,
          target_value: parseFloat(targetValue),
          period_type: periodType,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          is_team_goal: isTeamGoal,
          assigned_user_id: isTeamGoal ? null : assignedUserId,
        });

      if (error) throw error;

      toast.success("Goal created successfully");
      setDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error: any) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setGoalType("");
    setTargetValue("");
    setPeriodType("");
    setStartDate(undefined);
    setEndDate(undefined);
    setIsTeamGoal(false);
    setAssignedUserId("");
  };

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0;
    const percentage = (current / target) * 100;
    return Math.min(Math.round(percentage), 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading goals...</div>
        </div>
      </Layout>
    );
  }

  if (!hasAccess) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Access denied</div>
        </div>
      </Layout>
    );
  }

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Performance Goals
          </h1>
          <p className="text-muted-foreground mt-2">
            Set and track team and individual goals
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set performance targets for your team or individuals
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Q1 Revenue Target"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about this goal..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Goal Type *</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetValue">Target Value *</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="100000"
                  />
                </div>
              </div>

              <div>
                <Label>Period *</Label>
                <Select value={periodType} onValueChange={setPeriodType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIOD_TYPES.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isTeamGoal"
                  checked={isTeamGoal}
                  onChange={(e) => {
                    setIsTeamGoal(e.target.checked);
                    if (e.target.checked) setAssignedUserId("");
                  }}
                  className="cursor-pointer"
                />
                <Label htmlFor="isTeamGoal" className="cursor-pointer">
                  Team Goal (applies to entire team)
                </Label>
              </div>

              {!isTeamGoal && (
                <div>
                  <Label>Assign To *</Label>
                  <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleCreateGoal} className="w-full">
                Create Goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">Currently tracking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals.length}</div>
            <p className="text-xs text-muted-foreground">Goals achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Goals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.filter(g => g.is_team_goal).length}
            </div>
            <p className="text-xs text-muted-foreground">Shared objectives</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Goals</CardTitle>
          <CardDescription>Track progress towards performance targets</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No goals created yet
                  </TableCell>
                </TableRow>
              ) : (
                goals.map((goal) => {
                  const progress = getProgressPercentage(goal.current_value, goal.target_value);
                  return (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{goal.title}</div>
                          {goal.description && (
                            <div className="text-sm text-muted-foreground">
                              {goal.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {goal.goal_type.replace("_", " ")}
                      </TableCell>
                      <TableCell>
                        {goal.is_team_goal ? (
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            Team Goal
                          </Badge>
                        ) : (
                          goal.profiles?.full_name || "Unassigned"
                        )}
                      </TableCell>
                      <TableCell className="capitalize">{goal.period_type}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{goal.current_value.toLocaleString()}</span>
                            <span className="text-muted-foreground">
                              / {goal.target_value.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={progress} />
                          <div className="text-xs text-muted-foreground">{progress}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(goal.status)} className="capitalize">
                          {goal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{format(new Date(goal.start_date), "MMM dd")}</div>
                        <div className="text-muted-foreground">
                          to {format(new Date(goal.end_date), "MMM dd, yyyy")}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </Layout>
  );
}
