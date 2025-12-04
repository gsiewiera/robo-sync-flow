import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
import { TablePagination } from "@/components/ui/table-pagination";
import { useSortable } from "@/hooks/use-sortable";
import { usePagination } from "@/hooks/use-pagination";
import { useColumnVisibility } from "@/hooks/use-column-visibility";

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

type SortField = "serial_number" | "model" | "working_hours" | "created_at";

const STATUS_COLORS: Record<string, string> = {
  in_warehouse: "bg-muted text-muted-foreground",
  delivered: "bg-success text-success-foreground",
  in_service: "bg-primary text-primary-foreground",
  maintenance: "bg-warning text-warning-foreground",
};

const COLUMNS: ColumnConfig[] = [
  { key: "serial_number", label: "Serial Number", defaultVisible: true },
  { key: "model", label: "Model", defaultVisible: true },
  { key: "type", label: "Type", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "working_hours", label: "Working Hours", defaultVisible: true },
  { key: "delivery_date", label: "Delivery Date", defaultVisible: true },
  { key: "created_at", label: "Created", defaultVisible: false },
];

const Robots = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { sortField, sortDirection, handleSort, getSortIcon } = useSortable<SortField>({
    defaultField: "serial_number",
    defaultDirection: "asc",
  });

  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
    getPaginatedData,
    getTotalPages,
  } = usePagination<Robot>();

  const { visibleColumns, toggleColumn, isColumnVisible } = useColumnVisibility({
    columns: COLUMNS,
  });

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
    resetPage();
  }, [sortField, sortDirection]);

  const filteredRobots = useMemo(
    () =>
      robots.filter(
        (robot) =>
          robot.serial_number.toLowerCase().includes(search.toLowerCase()) ||
          robot.model.toLowerCase().includes(search.toLowerCase()) ||
          robot.type.toLowerCase().includes(search.toLowerCase())
      ),
    [robots, search]
  );

  const currentRecords = getPaginatedData(filteredRobots);
  const totalPages = getTotalPages(filteredRobots.length);

  return (
    <Layout>
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by serial number, model, or type..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="pl-10"
              />
            </div>
            <ColumnVisibilityToggle
              columns={COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
            />
          </div>
        </Card>

        <Card>
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                {isColumnVisible("serial_number") && (
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
                {isColumnVisible("model") && (
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
                {isColumnVisible("type") && (
                  <TableHead className="py-1.5 text-xs">Type</TableHead>
                )}
                {isColumnVisible("status") && (
                  <TableHead className="py-1.5 text-xs">Status</TableHead>
                )}
                {isColumnVisible("working_hours") && (
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
                {isColumnVisible("delivery_date") && (
                  <TableHead className="py-1.5 text-xs">Delivery Date</TableHead>
                )}
                {isColumnVisible("created_at") && (
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
                  <TableCell
                    colSpan={visibleColumns.length + 1}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
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
                    {isColumnVisible("serial_number") && (
                      <TableCell className="py-1.5 text-sm font-medium">
                        {robot.serial_number}
                      </TableCell>
                    )}
                    {isColumnVisible("model") && (
                      <TableCell className="py-1.5 text-sm">{robot.model}</TableCell>
                    )}
                    {isColumnVisible("type") && (
                      <TableCell className="py-1.5 text-sm">{robot.type}</TableCell>
                    )}
                    {isColumnVisible("status") && (
                      <TableCell className="py-1.5">
                        <Badge className={`${STATUS_COLORS[robot.status]} text-xs px-1.5 py-0`}>
                          {robot.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    )}
                    {isColumnVisible("working_hours") && (
                      <TableCell className="py-1.5 text-sm">{robot.working_hours}h</TableCell>
                    )}
                    {isColumnVisible("delivery_date") && (
                      <TableCell className="py-1.5 text-sm">
                        {robot.delivery_date
                          ? new Date(robot.delivery_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    )}
                    {isColumnVisible("created_at") && (
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

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredRobots.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </Layout>
  );
};

export default Robots;
