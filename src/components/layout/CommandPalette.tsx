import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getAllToolsForPalette, getIconComponent, type PaletteTool } from "@/lib/allToolsForPalette";
import { rankPaletteTools } from "@/lib/paletteSearch";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function flatten(groups: { category: string; tools: PaletteTool[] }[]): PaletteTool[] {
  return groups.flatMap((group) => group.tools);
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const toolsByCategory = getAllToolsForPalette();
  const catalog = useMemo(() => flatten(toolsByCategory), [toolsByCategory]);
  const query = search.trim();
  const results = useMemo(() => rankPaletteTools(catalog, query), [catalog, query]);

  const handleSelect = (path: string) => {
    navigate(path);
    setSearch("");
    onOpenChange(false);
  };

  const close = (next: boolean) => {
    if (!next) setSearch("");
    onOpenChange(next);
  };

  const returnFocusToSearch = (event: Event) => {
    event.preventDefault();
    document.querySelector<HTMLElement>("[data-palette-trigger]")?.focus();
  };

  const renderTool = (tool: PaletteTool) => {
    const Icon = getIconComponent(tool.icon);
    return (
      <CommandItem
        key={`${tool.category}-${tool.id}`}
        value={`${tool.category} ${tool.id} ${tool.name}`}
        onSelect={() => handleSelect(tool.path)}
        className="flex items-center gap-3 cursor-pointer py-2.5"
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{tool.name}</span>
          <span className="text-xs text-muted-foreground">{tool.description}</span>
        </div>
      </CommandItem>
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={close} onCloseAutoFocus={returnFocusToSearch} shouldFilter={false}>
      <CommandInput placeholder="Search tools..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        {query ? (
          results.length > 0 && <CommandGroup heading="Matches">{results.map(renderTool)}</CommandGroup>
        ) : (
          toolsByCategory.map(
            ({ category, tools }) =>
              tools.length > 0 && (
                <CommandGroup key={category} heading={category}>
                  {tools.map(renderTool)}
                </CommandGroup>
              ),
          )
        )}
      </CommandList>
    </CommandDialog>
  );
}
