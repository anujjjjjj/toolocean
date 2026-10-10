import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { stashFiles } from "@/lib/pendingFiles";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  title: string;
  hint: string;
  buttonLabel: string;
  className?: string;
  onIntent?: () => void;
}

/**
 * The only motion on a tool page: a solid ochre ring while a file is dragged
 * over the zone or the control is focused. Heavy libraries stay out of this file.
 */
export function FileDropzone({
  accept,
  multiple,
  title,
  hint,
  buttonLabel,
  className,
  onIntent,
}: FileDropzoneProps) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  const remember = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    stashFiles(Array.from(list));
  };

  const onDragEnter = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    depth.current += 1;
    setOver(true);
    onIntent?.();
  };

  const onDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setOver(false);
  };

  return (
    <label
      className={cn("paper-drop", over && "is-over", className)}
      onDragEnter={onDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        event.preventDefault();
        depth.current = 0;
        setOver(false);
        remember(event.dataTransfer.files);
      }}
      onMouseEnter={onIntent}
      onFocus={onIntent}
    >
      <span className="paper-drop-icon" aria-hidden="true">
        <Upload className="h-5 w-5" />
      </span>
      <span className="paper-drop-title">{title}</span>
      <span className="paper-drop-hint">{hint}</span>
      <span className="paper-drop-button">{buttonLabel}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        aria-label={title}
        onChange={(event) => remember(event.target.files)}
      />
    </label>
  );
}
