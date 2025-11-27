import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Circle, MoreHorizontal, Eye, Edit, Filter, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskFormSheet } from "@/components/tasks/TaskFormSheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue";
  due_date: string | null;
  call_attempted: boolean;
  call_successful: boolean;
  assigned_to: string | null;
}

interface Profile {
  id: string;
  full_name: string;
}

interface TaskTitleDictionary {
  id: string;
  title: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  overdue: "bg-destructive text-destructive-foreground",
};

const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [forToday, setForToday] = useState(false);
  const [titleFilters, setTitleFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [assignedToFilters, setAssignedToFilters] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [taskTitles, setTaskTitles] = useState<TaskTitleDictionary[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const recordsPerPage = 20;

  useEffect(() => {
    checkUserRole();
    fetchEmployees();
    fetchTaskTitles();
  }, []);

  useEffect(() => {
    fetchTasks();
    setCurrentPage(1);
  }, [forToday, titleFilters, statusFilters, assignedToFilters]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserRole(data.role);
    }
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (data) {
      setEmployees(data);
    }
  };

  const fetchTaskTitles = async () => {
    const { data } = await supabase
      .from("task_title_dictionary")
      .select("id, title")
      .order("title");

    if (data) {
      setTaskTitles(data);
    }
  };

  const fetchTasks = async () => {
    let query = supabase
      .from("tasks")
      .select("*");

    // Apply filters
    if (forToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query = query
        .gte("due_date", today.toISOString())
        .lt("due_date", tomorrow.toISOString());
    }

    if (titleFilters.length > 0) {
      query = query.in("title", titleFilters);
    }

    if (statusFilters.length > 0) {
      query = query.in("status", statusFilters as Task["status"][]);
    }

    if (assignedToFilters.length > 0) {
      query = query.in("assigned_to", assignedToFilters);
    }

    query = query.order("due_date", { ascending: true });

    const { data, error } = await query;

    if (data && !error) {
      setTasks(data);
    }
  };

  const clearFilters = () => {
    setForToday(false);
    setTitleFilters([]);
    setStatusFilters([]);
    setAssignedToFilters([]);
  };

  const toggleTitleFilter = (title: string) => {
    setTitleFilters(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleAssignedToFilter = (employeeId: string) => {
    setAssignedToFilters(prev =>
      prev.includes(employeeId) ? prev.filter(e => e !== employeeId) : [...prev, employeeId]
    );
  };

  const handleMarkComplete = async (taskId: string) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", taskId);

    if (!error) {
      fetchTasks();
    }
  };

  // Pagination calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = tasks.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(tasks.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">Manage your daily tasks and follow-ups</p>
          </div>
          <Button size="lg" className="h-11 px-6" onClick={() => setIsFormOpen(true)}>
            New Task
          </Button>
        </div>

        <TaskFormSheet
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSuccess={fetchTasks}
        />

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <Button
              variant={forToday ? "default" : "outline"}
              onClick={() => setForToday(!forToday)}
              className="h-10"
            >
              <Filter className="mr-2 h-4 w-4" />
              For Today
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 w-[200px] justify-between">
                  Task {titleFilters.length > 0 && `(${titleFilters.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3 bg-background z-50" align="start">
                <div className="space-y-2">
                  {taskTitles.map((taskTitle) => (
                    <div key={taskTitle.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`title-${taskTitle.id}`}
                        checked={titleFilters.includes(taskTitle.title)}
                        onCheckedChange={() => toggleTitleFilter(taskTitle.title)}
                      />
                      <label
                        htmlFor={`title-${taskTitle.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {taskTitle.title}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 w-[180px] justify-between">
                  Status {statusFilters.length > 0 && `(${statusFilters.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-3 bg-background z-50" align="start">
                <div className="space-y-2">
                  {[
                    { value: "pending", label: "Pending" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "completed", label: "Completed" },
                    { value: "overdue", label: "Overdue" },
                  ].map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={statusFilters.includes(status.value)}
                        onCheckedChange={() => toggleStatusFilter(status.value)}
                      />
                      <label
                        htmlFor={`status-${status.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {status.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {(userRole === "admin" || userRole === "manager") && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-[200px] justify-between">
                    Employee {assignedToFilters.length > 0 && `(${assignedToFilters.length})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-3 bg-background z-50" align="start">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {employees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={assignedToFilters.includes(employee.id)}
                          onCheckedChange={() => toggleAssignedToFilter(employee.id)}
                        />
                        <label
                          htmlFor={`employee-${employee.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {employee.full_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {(forToday || titleFilters.length > 0 || statusFilters.length > 0 || assignedToFilters.length > 0) && (
              <Button variant="ghost" onClick={clearFilters} className="h-10">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Call Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((task) => (
                  <TableRow key={task.id} className="h-12">
                    <TableCell>
                      <button
                        onClick={() => handleMarkComplete(task.id)}
                        disabled={task.status === "completed"}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[task.status]}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {task.call_attempted && (
                          <Badge variant="outline" className="text-xs">Attempted</Badge>
                        )}
                        {task.call_successful && (
                          <Badge variant="outline" className="text-xs bg-success/10 text-success border-success">
                            Success
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </Layout>
  );
};

export default Tasks;
