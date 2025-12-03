import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import { CheckCircle, Circle, Eye, Edit, Filter, X, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Flag } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TaskFormSheet } from "@/components/tasks/TaskFormSheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableFilterDropdown } from "@/components/ui/searchable-filter-dropdown";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: string | null;
  due_date: string | null;
  call_attempted: boolean;
  call_successful: boolean;
  assigned_to: string | null;
  client_id: string | null;
  contract_id: string | null;
  created_at: string | null;
}
interface Profile {
  id: string;
  full_name: string;
}
interface TaskTitleDictionary {
  id: string;
  title: string;
}
interface Client {
  id: string;
  name: string;
}
interface Contract {
  id: string;
  contract_number: string;
}
const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success text-success-foreground",
  overdue: "bg-destructive text-destructive-foreground"
};
const priorityConfig: Record<string, {
  color: string;
  icon: string;
}> = {
  low: {
    color: "text-muted-foreground",
    icon: "text-muted-foreground"
  },
  medium: {
    color: "text-yellow-500",
    icon: "text-yellow-500"
  },
  high: {
    color: "text-orange-500",
    icon: "text-orange-500"
  },
  urgent: {
    color: "text-destructive",
    icon: "text-destructive"
  }
};
const columns: ColumnConfig[] = [{
  key: "title",
  label: "Title",
  defaultVisible: true
}, {
  key: "priority",
  label: "Priority",
  defaultVisible: true
}, {
  key: "status",
  label: "Status",
  defaultVisible: true
}, {
  key: "due_date",
  label: "Due Date",
  defaultVisible: true
}, {
  key: "created_at",
  label: "Created",
  defaultVisible: false
}, {
  key: "call_status",
  label: "Call Status",
  defaultVisible: true
}];
const Tasks = () => {
  const {
    t
  } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [forToday, setForToday] = useState(false);
  const [titleFilters, setTitleFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [assignedToFilters, setAssignedToFilters] = useState<string[]>([]);
  const [clientFilters, setClientFilters] = useState<string[]>([]);
  const [contractFilters, setContractFilters] = useState<string[]>([]);
  const [sortField, setSortField] = useState<"due_date" | "created_at">("due_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [taskTitles, setTaskTitles] = useState<TaskTitleDictionary[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [formMode, setFormMode] = useState<"create" | "view" | "edit">("create");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.filter(col => col.defaultVisible !== false).map(col => col.key));
  const recordsPerPage = 30;
  useEffect(() => {
    checkUserRole();
    fetchEmployees();
    fetchTaskTitles();
    fetchClients();
    fetchContracts();
  }, []);
  useEffect(() => {
    fetchTasks();
    setCurrentPage(1);
  }, [forToday, titleFilters, statusFilters, assignedToFilters, clientFilters, contractFilters, sortField, sortDirection]);
  const checkUserRole = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const {
      data
    } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
    if (data) {
      setUserRole(data.role);
    }
  };
  const fetchEmployees = async () => {
    const {
      data
    } = await supabase.from("profiles").select("id, full_name").order("full_name");
    if (data) {
      setEmployees(data);
    }
  };
  const fetchTaskTitles = async () => {
    const {
      data
    } = await supabase.from("task_title_dictionary").select("id, title").order("title");
    if (data) {
      setTaskTitles(data);
    }
  };
  const fetchClients = async () => {
    const {
      data
    } = await supabase.from("clients").select("id, name").order("name");
    if (data) {
      setClients(data);
    }
  };
  const fetchContracts = async () => {
    const {
      data
    } = await supabase.from("contracts").select("id, contract_number").order("contract_number");
    if (data) {
      setContracts(data);
    }
  };
  const fetchTasks = async () => {
    let query = supabase.from("tasks").select("*");

    // Apply filters
    if (forToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query = query.gte("due_date", today.toISOString()).lt("due_date", tomorrow.toISOString());
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
    if (clientFilters.length > 0) {
      query = query.in("client_id", clientFilters);
    }
    if (contractFilters.length > 0) {
      query = query.in("contract_id", contractFilters);
    }
    query = query.order(sortField, {
      ascending: sortDirection === "asc",
      nullsFirst: false
    });
    const {
      data,
      error
    } = await query;
    if (data && !error) {
      setTasks(data);
    }
  };
  const clearFilters = () => {
    setForToday(false);
    setTitleFilters([]);
    setStatusFilters([]);
    setAssignedToFilters([]);
    setClientFilters([]);
    setContractFilters([]);
  };
  const toggleTitleFilter = (title: string) => {
    setTitleFilters(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };
  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };
  const toggleAssignedToFilter = (employeeId: string) => {
    setAssignedToFilters(prev => prev.includes(employeeId) ? prev.filter(e => e !== employeeId) : [...prev, employeeId]);
  };
  const toggleClientFilter = (clientId: string) => {
    setClientFilters(prev => prev.includes(clientId) ? prev.filter(c => c !== clientId) : [...prev, clientId]);
  };
  const toggleContractFilter = (contractId: string) => {
    setContractFilters(prev => prev.includes(contractId) ? prev.filter(c => c !== contractId) : [...prev, contractId]);
  };
  const handleMarkComplete = async (taskId: string) => {
    const {
      error
    } = await supabase.from("tasks").update({
      status: "completed"
    }).eq("id", taskId);
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
  const handleNewTask = () => {
    setSelectedTaskId(undefined);
    setFormMode("create");
    setIsFormOpen(true);
  };
  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setFormMode("view");
    setIsFormOpen(true);
  };
  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setFormMode("edit");
    setIsFormOpen(true);
  };
  const handleSort = (field: "due_date" | "created_at") => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection("asc");
    }
  };
  const getSortIcon = (field: "due_date" | "created_at") => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };
  return <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button size="lg" className="h-11 px-6" onClick={handleNewTask}>
            {t("tasks.addTask")}
          </Button>
        </div>

        <TaskFormSheet open={isFormOpen} onOpenChange={setIsFormOpen} onSuccess={fetchTasks} taskId={selectedTaskId} mode={formMode} />

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-4">
            <Button variant={forToday ? "default" : "outline"} onClick={() => setForToday(!forToday)} className="h-10">
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
                  {taskTitles.map(taskTitle => <div key={taskTitle.id} className="flex items-center space-x-2">
                      <Checkbox id={`title-${taskTitle.id}`} checked={titleFilters.includes(taskTitle.title)} onCheckedChange={() => toggleTitleFilter(taskTitle.title)} />
                      <label htmlFor={`title-${taskTitle.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {taskTitle.title}
                      </label>
                    </div>)}
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
                  {[{
                  value: "pending",
                  label: "Pending"
                }, {
                  value: "in_progress",
                  label: "In Progress"
                }, {
                  value: "completed",
                  label: "Completed"
                }, {
                  value: "overdue",
                  label: "Overdue"
                }].map(status => <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox id={`status-${status.value}`} checked={statusFilters.includes(status.value)} onCheckedChange={() => toggleStatusFilter(status.value)} />
                      <label htmlFor={`status-${status.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {status.label}
                      </label>
                    </div>)}
                </div>
              </PopoverContent>
            </Popover>

            {(userRole === "admin" || userRole === "manager") && <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 w-[200px] justify-between">
                    Employee {assignedToFilters.length > 0 && `(${assignedToFilters.length})`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-3 bg-background z-50" align="start">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {employees.map(employee => <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox id={`employee-${employee.id}`} checked={assignedToFilters.includes(employee.id)} onCheckedChange={() => toggleAssignedToFilter(employee.id)} />
                        <label htmlFor={`employee-${employee.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          {employee.full_name}
                        </label>
                      </div>)}
                  </div>
                </PopoverContent>
              </Popover>}

            <SearchableFilterDropdown options={clients.map(c => ({
            id: c.id,
            label: c.name
          }))} selectedValues={clientFilters} onToggle={toggleClientFilter} placeholder="Customer" searchPlaceholder="Search customer..." />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 w-[200px] justify-between">
                  Contract {contractFilters.length > 0 && `(${contractFilters.length})`}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-3 bg-background z-50" align="start">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {contracts.map(contract => <div key={contract.id} className="flex items-center space-x-2">
                      <Checkbox id={`contract-${contract.id}`} checked={contractFilters.includes(contract.id)} onCheckedChange={() => toggleContractFilter(contract.id)} />
                      <label htmlFor={`contract-${contract.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                        {contract.contract_number}
                      </label>
                    </div>)}
                </div>
              </PopoverContent>
            </Popover>

            {(forToday || titleFilters.length > 0 || statusFilters.length > 0 || assignedToFilters.length > 0 || clientFilters.length > 0 || contractFilters.length > 0) && <Button variant="ghost" onClick={clearFilters} className="h-10">
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>}

            <div className="ml-auto">
              <ColumnVisibilityToggle columns={columns} visibleColumns={visibleColumns} onToggleColumn={key => setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])} />
            </div>
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="w-8 py-1.5"></TableHead>
                {visibleColumns.includes("title") && <TableHead className="py-1.5 text-xs">Title</TableHead>}
                {visibleColumns.includes("priority") && <TableHead className="py-1.5 text-xs">Priority</TableHead>}
                {visibleColumns.includes("status") && <TableHead className="py-1.5 text-xs">Status</TableHead>}
                {visibleColumns.includes("due_date") && <TableHead className="py-1.5 text-xs">
                    <Button variant="ghost" size="sm" onClick={() => handleSort("due_date")} className="h-6 px-1 -ml-1 text-xs font-medium hover:bg-transparent">
                      Due Date
                      {getSortIcon("due_date")}
                    </Button>
                  </TableHead>}
                {visibleColumns.includes("created_at") && <TableHead className="py-1.5 text-xs">
                    <Button variant="ghost" size="sm" onClick={() => handleSort("created_at")} className="h-6 px-1 -ml-1 text-xs font-medium hover:bg-transparent">
                      Created
                      {getSortIcon("created_at")}
                    </Button>
                  </TableHead>}
                {visibleColumns.includes("call_status") && <TableHead className="py-1.5 text-xs">Call Status</TableHead>}
                <TableHead className="w-20 py-1.5 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-6 text-muted-foreground text-sm">
                    No tasks found
                  </TableCell>
                </TableRow> : currentRecords.map(task => <TableRow key={task.id} className="h-9 cursor-pointer hover:bg-muted/50" onClick={() => handleViewTask(task.id)}>
                    <TableCell className="py-1.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleMarkComplete(task.id)} disabled={task.status === "completed"}>
                        {task.status === "completed" ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />}
                      </button>
                    </TableCell>
                    {visibleColumns.includes("title") && <TableCell className="py-1.5">
                        <span className="text-sm font-medium">{task.title}</span>
                      </TableCell>}
                    {visibleColumns.includes("priority") && <TableCell className="py-1.5">
                        {task.priority && <div className="flex items-center gap-1">
                            <Flag className={`h-3 w-3 ${priorityConfig[task.priority]?.icon || 'text-muted-foreground'}`} />
                            <span className={`text-xs capitalize ${priorityConfig[task.priority]?.color || ''}`}>
                              {task.priority}
                            </span>
                          </div>}
                      </TableCell>}
                    {visibleColumns.includes("status") && <TableCell className="py-1.5">
                        <Badge className={`${statusColors[task.status]} text-xs px-1.5 py-0`}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </TableCell>}
                    {visibleColumns.includes("due_date") && <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : "-"}
                      </TableCell>}
                    {visibleColumns.includes("created_at") && <TableCell className="py-1.5 text-xs text-muted-foreground">
                        {task.created_at ? new Date(task.created_at).toLocaleDateString() : "-"}
                      </TableCell>}
                    {visibleColumns.includes("call_status") && <TableCell className="py-1.5">
                        <div className="flex gap-1">
                          {task.call_attempted && <Badge variant="outline" className="text-[10px] px-1 py-0">Attempted</Badge>}
                          {task.call_successful && <Badge variant="outline" className="text-[10px] px-1 py-0 bg-success/10 text-success border-success">
                              Success
                            </Badge>}
                        </div>
                      </TableCell>}
                    <TableCell className="py-1.5" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleViewTask(task.id)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleEditTask(task.id)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
            </TableBody>
          </Table>
        </Card>

        {totalPages > 1 && <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => handlePageChange(Math.max(1, currentPage - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
              </PaginationItem>
              {Array.from({
            length: totalPages
          }, (_, i) => i + 1).map(page => <PaginationItem key={page}>
                  <PaginationLink onClick={() => handlePageChange(page)} isActive={currentPage === page} className="cursor-pointer">
                    {page}
                  </PaginationLink>
                </PaginationItem>)}
              <PaginationItem>
                <PaginationNext onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>}
      </div>
    </Layout>;
};
export default Tasks;