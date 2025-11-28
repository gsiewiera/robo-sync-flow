import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trophy, TrendingUp, Target, DollarSign, Award, Crown, Medal, Star } from "lucide-react";
import { toast } from "sonner";

interface UserPerformance {
  id: string;
  full_name: string;
  email: string;
  totalOffers: number;
  wonOffers: number;
  conversionRate: number;
  totalRevenue: number;
  averageDealSize: number;
  completedTasks: number;
  activeClients: number;
  rank: number;
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [leaderboard, setLeaderboard] = useState<UserPerformance[]>([]);
  const [sortBy, setSortBy] = useState<"revenue" | "conversion" | "deals" | "tasks">("revenue");

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
    fetchLeaderboardData();
  };

  const fetchLeaderboardData = async () => {
    try {
      // Fetch all users with salesperson or manager roles
      const { data: usersWithRoles } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name, email)")
        .in("role", ["salesperson", "manager"]);

      if (!usersWithRoles) return;

      const userPerformances: UserPerformance[] = [];

      for (const userRole of usersWithRoles) {
        const user = (userRole as any).profiles;
        if (!user) continue;

        // Fetch offers
        const { data: offers } = await supabase
          .from("offers")
          .select("stage, total_price")
          .eq("created_by", user.id);

        // Fetch tasks
        const { data: tasks } = await supabase
          .from("tasks")
          .select("status")
          .eq("assigned_to", user.id);

        // Fetch clients
        const { data: clients } = await supabase
          .from("clients")
          .select("status")
          .eq("assigned_salesperson_id", user.id);

        const totalOffers = offers?.length || 0;
        const wonOffers = offers?.filter(o => o.stage === "closed_won").length || 0;
        const conversionRate = totalOffers > 0 ? (wonOffers / totalOffers) * 100 : 0;

        const wonOffersWithValue = offers?.filter(
          o => o.stage === "closed_won" && o.total_price
        ) || [];
        const totalRevenue = wonOffersWithValue.reduce(
          (sum, o) => sum + (o.total_price || 0),
          0
        );
        const averageDealSize = wonOffers > 0 ? totalRevenue / wonOffers : 0;

        const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
        const activeClients = clients?.filter(c => c.status === "active").length || 0;

        userPerformances.push({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          totalOffers,
          wonOffers,
          conversionRate,
          totalRevenue,
          averageDealSize,
          completedTasks,
          activeClients,
          rank: 0,
        });
      }

      // Sort and rank
      sortAndRankUsers(userPerformances, sortBy);
      setLeaderboard(userPerformances);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Failed to load leaderboard data");
    } finally {
      setLoading(false);
    }
  };

  const sortAndRankUsers = (users: UserPerformance[], metric: string) => {
    users.sort((a, b) => {
      switch (metric) {
        case "revenue":
          return b.totalRevenue - a.totalRevenue;
        case "conversion":
          return b.conversionRate - a.conversionRate;
        case "deals":
          return b.wonOffers - a.wonOffers;
        case "tasks":
          return b.completedTasks - a.completedTasks;
        default:
          return b.totalRevenue - a.totalRevenue;
      }
    });

    users.forEach((user, index) => {
      user.rank = index + 1;
    });
  };

  const handleSortChange = (metric: "revenue" | "conversion" | "deals" | "tasks") => {
    setSortBy(metric);
    const sortedUsers = [...leaderboard];
    sortAndRankUsers(sortedUsers, metric);
    setLeaderboard(sortedUsers);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground">#{rank}</span>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🏆 Top Performer</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 Runner Up</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600">🥉 Third Place</Badge>;
    if (rank <= 5) return <Badge variant="secondary">⭐ Top 5</Badge>;
    return null;
  };

  const getAchievements = (user: UserPerformance) => {
    const achievements = [];
    if (user.conversionRate >= 50) achievements.push("High Converter");
    if (user.totalRevenue >= 100000) achievements.push("Revenue Star");
    if (user.wonOffers >= 10) achievements.push("Deal Maker");
    if (user.completedTasks >= 20) achievements.push("Task Master");
    if (user.activeClients >= 5) achievements.push("Client Champion");
    return achievements;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading leaderboard...</div>
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

  const topPerformers = leaderboard.slice(0, 3);

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Team Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Top performers and team achievements
        </p>
      </div>

      {/* Top 3 Podium */}
      {topPerformers.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Second Place */}
          {topPerformers[1] && (
            <Card className="border-gray-400">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Medal className="h-12 w-12 text-gray-400" />
                </div>
                <CardTitle className="text-lg">{topPerformers[1].full_name}</CardTitle>
                <CardDescription>#2 Overall</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl font-bold">
                  {topPerformers[1].totalRevenue.toLocaleString()} PLN
                </div>
                <div className="text-sm text-muted-foreground">
                  {topPerformers[1].conversionRate.toFixed(1)}% conversion
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/users/${topPerformers[1].id}`)}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* First Place */}
          <Card className="border-yellow-500 md:scale-105 md:-mt-4">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <Crown className="h-16 w-16 text-yellow-500" />
              </div>
              <CardTitle className="text-xl">{topPerformers[0].full_name}</CardTitle>
              <CardDescription className="font-bold">#1 Top Performer</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="text-3xl font-bold">
                {topPerformers[0].totalRevenue.toLocaleString()} PLN
              </div>
              <div className="text-sm text-muted-foreground">
                {topPerformers[0].conversionRate.toFixed(1)}% conversion
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/admin/users/${topPerformers[0].id}`)}
              >
                View Profile
              </Button>
            </CardContent>
          </Card>

          {/* Third Place */}
          {topPerformers[2] && (
            <Card className="border-amber-600">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <Medal className="h-12 w-12 text-amber-600" />
                </div>
                <CardTitle className="text-lg">{topPerformers[2].full_name}</CardTitle>
                <CardDescription>#3 Overall</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <div className="text-2xl font-bold">
                  {topPerformers[2].totalRevenue.toLocaleString()} PLN
                </div>
                <div className="text-sm text-muted-foreground">
                  {topPerformers[2].conversionRate.toFixed(1)}% conversion
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/users/${topPerformers[2].id}`)}
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Leaderboard Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue" onClick={() => handleSortChange("revenue")}>
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="conversion" onClick={() => handleSortChange("conversion")}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Conversion Rate
          </TabsTrigger>
          <TabsTrigger value="deals" onClick={() => handleSortChange("deals")}>
            <Trophy className="h-4 w-4 mr-2" />
            Deals Won
          </TabsTrigger>
          <TabsTrigger value="tasks" onClick={() => handleSortChange("tasks")}>
            <Target className="h-4 w-4 mr-2" />
            Tasks Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={sortBy}>
          <Card>
            <CardHeader>
              <CardTitle>Team Rankings</CardTitle>
              <CardDescription>
                Performance metrics across the team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Total Revenue</TableHead>
                    <TableHead>Conversion Rate</TableHead>
                    <TableHead>Won Deals</TableHead>
                    <TableHead>Avg Deal Size</TableHead>
                    <TableHead>Tasks Done</TableHead>
                    <TableHead>Achievements</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((user) => {
                    const achievements = getAchievements(user);
                    return (
                      <TableRow key={user.id} className={user.rank <= 3 ? "bg-muted/50" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankIcon(user.rank)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {getRankBadge(user.rank)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.totalRevenue.toLocaleString()} PLN
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.conversionRate.toFixed(1)}%
                            {user.conversionRate >= 40 && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.wonOffers}</TableCell>
                        <TableCell>
                          {user.averageDealSize > 0
                            ? `${user.averageDealSize.toLocaleString()} PLN`
                            : "-"}
                        </TableCell>
                        <TableCell>{user.completedTasks}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {achievements.length > 0 ? (
                              achievements.slice(0, 2).map((achievement, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {achievement}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                            {achievements.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{achievements.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </Layout>
  );
}
