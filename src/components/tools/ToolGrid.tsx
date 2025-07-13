
import { useState, useMemo } from "react";
import { ToolCard } from "./ToolCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Grid, List } from "lucide-react";
import toolsData from "@/data/tools.json";

interface ToolGridProps {
  searchQuery: string;
  onAddToWorkflow?: (toolId: string) => void;
  showWorkflowButtons?: boolean;
}

export function ToolGrid({ searchQuery, onAddToWorkflow, showWorkflowButtons = false }: ToolGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { tools, categories } = toolsData;

  const filteredTools = useMemo(() => {
    let filtered = tools;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords.some(keyword => keyword.toLowerCase().includes(query)) ||
        tool.category.toLowerCase().includes(query)
      );
    }

    // Sort featured tools first
    return filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
  }, [searchQuery, selectedCategory]);

  // Group tools by category for organized display
  const toolsByCategory = useMemo(() => {
    const grouped: { [key: string]: typeof tools } = {};
    
    // If there's a search query or category filter, don't group
    if (searchQuery.trim() || selectedCategory) {
      return null;
    }

    categories.forEach(category => {
      grouped[category.id] = tools.filter(tool => tool.category === category.id);
    });

    return grouped;
  }, [searchQuery, selectedCategory]);

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-8"
          >
            All Tools
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {tools.length}
            </Badge>
          </Button>
          
          {categories.map(category => {
            const count = tools.filter(tool => tool.category === category.id).length;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="h-8"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {count}
                </Badge>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-muted" : ""}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-muted" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Found {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} 
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Tools Display - Either grouped by category or flat list */}
      {filteredTools.length > 0 ? (
        toolsByCategory ? (
          // Grouped by categories
          <div className="space-y-8">
            {Object.entries(toolsByCategory).map(([categoryId, categoryTools]) => (
              categoryTools.length > 0 && (
                <div key={categoryId} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold capitalize">
                      {getCategoryName(categoryId)} Tools
                    </h3>
                    <Badge variant="outline" className="h-6">
                      {categoryTools.length}
                    </Badge>
                  </div>
                  
                  <div className={
                    viewMode === "grid" 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                      : "space-y-4"
                  }>
                    {categoryTools.map(tool => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onAddToWorkflow={onAddToWorkflow}
                        showWorkflowButton={showWorkflowButtons}
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          // Flat list (when searching or filtering)
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "space-y-4"
          }>
            {filteredTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onAddToWorkflow={onAddToWorkflow}
                showWorkflowButton={showWorkflowButtons}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tools found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
