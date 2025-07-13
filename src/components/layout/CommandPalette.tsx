
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import toolsData from "@/data/tools.json";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { tools, categories } = toolsData;

  const handleSelect = (toolId: string) => {
    navigate(`/tools/${toolId}`);
    onOpenChange(false);
  };

  // Group tools by category
  const toolsByCategory = categories.map(category => ({
    ...category,
    tools: tools.filter(tool => tool.category === category.id)
  }));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tools..." />
      <CommandList>
        <CommandEmpty>No tools found.</CommandEmpty>
        
        {toolsByCategory.map(category => (
          category.tools.length > 0 && (
            <CommandGroup key={category.id} heading={category.name}>
              {category.tools.map(tool => {
                const IconComponent = (Icons as any)[tool.icon] as LucideIcon;
                const Icon = IconComponent || Icons.Wrench;
                
                return (
                  <CommandItem
                    key={tool.id}
                    value={`${tool.name} ${tool.description} ${tool.keywords.join(' ')}`}
                    onSelect={() => handleSelect(tool.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{tool.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )
        ))}
      </CommandList>
    </CommandDialog>
  );
}
