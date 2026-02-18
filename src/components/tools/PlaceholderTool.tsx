interface PlaceholderToolProps {
  name?: string;
  description?: string;
}

export function PlaceholderTool({ name = "This tool", description }: PlaceholderToolProps) {
  return (
    <div className="text-center py-12 px-6 rounded-lg border-2 border-dashed border-muted">
      <h3 className="text-lg font-semibold mb-2">{name} coming soon</h3>
      <p className="text-muted-foreground">
        {description || "We're working on this tool. Check back shortly!"}
      </p>
    </div>
  );
}
