import { useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface FilterOption {
  id: string;
  label: string;
}

interface SearchableFilterDropdownProps {
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
}

export function SearchableFilterDropdown({
  options,
  selectedValues,
  onToggle,
  placeholder,
  searchPlaceholder = "Search...",
  className,
}: SearchableFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-10 w-[200px] justify-between", className)}>
          {placeholder} {selectedValues.length > 0 && `(${selectedValues.length})`}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 bg-popover z-50" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
          {filteredOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results found
            </p>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => onToggle(option.id)}
              >
                <Checkbox
                  id={`filter-${option.id}`}
                  checked={selectedValues.includes(option.id)}
                  onCheckedChange={() => onToggle(option.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                >
                  {option.label}
                </label>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Single-select searchable dropdown
interface SearchableSelectDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  allLabel?: string;
  className?: string;
}

export function SearchableSelectDropdown({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = "Search...",
  allLabel = "All",
  className,
}: SearchableSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find((o) => o.id === value);
  const displayText = value === "all" ? allLabel : selectedOption?.label || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-between", className)}>
          {displayText}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-popover z-50" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          <div
            className={cn(
              "flex items-center px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted",
              value === "all" && "bg-muted"
            )}
            onClick={() => {
              onChange("all");
              setOpen(false);
              setSearchQuery("");
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === "all" ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="text-sm">{allLabel}</span>
          </div>
          {filteredOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No results found
            </p>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                className={cn(
                  "flex items-center px-2 py-1.5 rounded-sm cursor-pointer hover:bg-muted",
                  value === option.id && "bg-muted"
                )}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                  setSearchQuery("");
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
