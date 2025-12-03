import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ColumnVisibilityToggle, ColumnConfig } from "@/components/ui/column-visibility-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Robot {
  id: string;
  serial_number: string;
  model: string;
  type: string;
  status: string;
  working_hours: number;
  delivery_date: string | null;
  created_at: string | null;
}

const statusColors: Record<string, string> = {
  in_warehouse: "bg-muted text-muted-foreground",
  delivered: "bg-success text-success-foreground",
  in_service: "bg-primary text-primary-foreground",
  maintenance: "bg-warning text-warning-foreground",
};

const Robots = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"serial_number" | "model" | "working_hours" | "created_at">("serial_number");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const navigate = useNavigate();
  const recordsPerPage = 30;

  const columns: ColumnConfig[] = [
    { key: "serial_number", label: "Serial Number", defaultVisible: true },
    { key: "model", label: "Model", defaultVisible: true },
    { key: "type", label: "Type", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "working_hours", label: "Working Hours", defaultVisible: true },
    { key: "delivery_date", label: "Delivery Date", defaultVisible: true },
    { key: "created_at", label: "Created", defaultVisible: false },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter((col) => col.defaultVisible).map((col) => col.key)
  );

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    const { data, error } = await supabase
      .from("robots")
      .select("*")
      .order(sortField, { ascending: sortDirection === "asc", nullsFirst: false });

    if (data && !error) {
      setRobots(data);
    }
  };

  useEffect(() => {
    fetchRobots();
    setCurrentPage(1);
  }, [sortField, sortDirection]);

  const filteredRobots = robots.filter((robot) =>
    robot.serial_number.toLowerCase().includes(search.toLowerCase()) ||
    robot.model.toLowerCase().includes(search.toLowerCase()) ||
    robot.type.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRobots.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRobots.length / recordsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (field: "serial_number" | "model" | "working_hours" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: "serial_number" | "model" | "working_hours" | "created_at") => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Robot Registry</h1>
          <p className="text-muted-foreground">Track and manage all robots</p>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by serial number, model, or type..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <ColumnVisibilityToggle
              columns={columns}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                {visibleColumns.includes("serial_number") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("serial_number")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      Serial Number
                      {getSortIcon("serial_number")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("model") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("model")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      Model
                      {getSortIcon("model")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("type") && (
                  <TableHead className="py-1.5 text-xs">Type</TableHead>
                )}
                {visibleColumns.includes("status") && (
                  <TableHead className="py-1.5 text-xs">Status</TableHead>
                )}
                {visibleColumns.includes("working_hours") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("working_hours")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      Working Hours
                      {getSortIcon("working_hours")}
                    </Button>
                  </TableHead>
                )}
                {visibleColumns.includes("delivery_date") && (
                  <TableHead className="py-1.5 text-xs">Delivery Date</TableHead>
                )}
                {visibleColumns.includes("created_at") && (
                  <TableHead className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("created_at")}
                      className="h-7 px-2 -ml-2 text-xs font-medium hover:bg-transparent"
                    >
                      Created
                      {getSortIcon("created_at")}
                    </Button>
                  </TableHead>
                )}
                <TableHead className="w-16 py-1.5 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                    No robots found
                  </TableCell>
                </TableRow>
              ) : (
                currentRecords.map((robot) => (
                  <TableRow 
                    key={robot.id} 
                    className="h-9 cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/robots/${robot.id}`)}
                  >
                    {visibleColumns.includes("serial_number") && (
                      <TableCell className="py-1.5 text-sm font-medium">{robot.serial_number}</TableCell>
                    )}
                    {visibleColumns.includes("model") && (
                      <TableCell className="py-1.5 text-sm">{robot.model}</TableCell>
                    )}
                    {visibleColumns.includes("type") && (
                      <TableCell className="py-1.5 text-sm">{robot.type}</TableCell>
                    )}
                    {visibleColumns.includes("status") && (
                      <TableCell className="py-1.5">
                        <Badge className={`${statusColors[robot.status]} text-xs px-1.5 py-0`}>
                          {robot.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("working_hours") && (
                      <TableCell className="py-1.5 text-sm">{robot.working_hours}h</TableCell>
                    )}
                    {visibleColumns.includes("delivery_date") && (
                      <TableCell className="py-1.5 text-sm">
                        {robot.delivery_date
                          ? new Date(robot.delivery_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("created_at") && (
                      <TableCell className="py-1.5 text-sm">
                        {robot.created_at
                          ? new Date(robot.created_at).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    )}
                    <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => navigate(`/robots/${robot.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
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

export default Robots;
