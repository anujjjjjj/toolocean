import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getAllToolsForPalette, getIconComponent } from "@/lib/allToolsForPalette";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const toolsByCategory = getAllToolsForPalette();

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tools..." />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>

        {toolsByCategory.map(
          ({ category, tools }) =>
            tools.length > 0 && (
              <CommandGroup key={category} heading={category}>
                {tools.map((tool) => {
                  const Icon = getIconComponent(tool.icon);
                  const searchValue = `${tool.name} ${tool.description} ${tool.keywords.join(" ")}`;

                  return (
                    <CommandItem
                      key={tool.id}
                      value={searchValue}
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
                })}
              </CommandGroup>
            )
        )}
      </CommandList>
    </CommandDialog>
  );
}
