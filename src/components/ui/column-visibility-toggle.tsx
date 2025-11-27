import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";

export interface ColumnConfig {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnVisibilityToggleProps {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onToggleColumn: (columnKey: string) => void;
}

export const ColumnVisibilityToggle = ({
  columns,
  visibleColumns,
  onToggleColumn,
}: ColumnVisibilityToggleProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10">
          <Settings2 className="mr-2 h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-3 bg-background z-50" align="end">
        <div className="space-y-2">
          {columns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={`column-${column.key}`}
                checked={visibleColumns.includes(column.key)}
                onCheckedChange={() => onToggleColumn(column.key)}
              />
              <label
                htmlFor={`column-${column.key}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
