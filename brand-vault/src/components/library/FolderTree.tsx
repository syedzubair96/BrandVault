import { ChevronRight, Folder as FolderIcon, FolderOpen, Plus, Trash2 } from "lucide-react";
import type { Folder } from "../../api/folders";
import type { FolderNode } from "./tree-utils";

interface FolderTreeProps {
  nodes: FolderNode[];
  selectedId: number | null;
  expanded: ReadonlySet<number>;
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
  onAddSubfolder: (parent: Folder) => void;
  onDelete: (folder: Folder) => void;
  depth?: number;
}

const rowActionClass =
  "rounded p-1 text-slate-400 opacity-0 hover:bg-slate-200 focus-visible:opacity-100 group-hover:opacity-100";

export function FolderTree({
  nodes,
  selectedId,
  expanded,
  onSelect,
  onToggle,
  onAddSubfolder,
  onDelete,
  depth = 0,
}: FolderTreeProps) {
  return (
    <ul role={depth === 0 ? "tree" : "group"} className="space-y-0.5">
      {nodes.map(({ folder, children }) => {
        const hasChildren = children.length > 0;
        const isOpen = hasChildren && expanded.has(folder.id);
        const isSelected = folder.id === selectedId;
        const Icon = isSelected || isOpen ? FolderOpen : FolderIcon;

        return (
          <li
            key={folder.id}
            role="treeitem"
            aria-selected={isSelected}
            aria-expanded={hasChildren ? isOpen : undefined}
          >
            <div
              className={`group flex items-center rounded-lg pr-2 text-sm transition-colors ${
                isSelected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"
              }`}
              style={{ paddingLeft: `${depth * 16 + 4}px` }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => onToggle(folder.id)}
                  aria-label={isOpen ? `Collapse ${folder.FolderName}` : `Expand ${folder.FolderName}`}
                  className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                >
                  <ChevronRight
                    className={`size-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                    aria-hidden
                  />
                </button>
              ) : (
                <span className="w-6 shrink-0" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => onSelect(folder.id)}
                title={folder.FolderName}
                className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
              >
                <Icon
                  className={`size-4 shrink-0 ${isSelected ? "text-indigo-500" : "text-slate-400"}`}
                  aria-hidden
                />
                <span className={`truncate ${isSelected ? "font-semibold" : "font-medium"}`}>
                  {folder.FolderName}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onAddSubfolder(folder)}
                aria-label={`New subfolder in ${folder.FolderName}`}
                title="New subfolder"
                className={`${rowActionClass} hover:text-slate-700`}
              >
                <Plus className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onDelete(folder)}
                aria-label={`Delete ${folder.FolderName}`}
                title="Delete folder"
                className={`${rowActionClass} hover:text-red-600`}
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>

            {isOpen && (
              <FolderTree
                nodes={children}
                selectedId={selectedId}
                expanded={expanded}
                onSelect={onSelect}
                onToggle={onToggle}
                onAddSubfolder={onAddSubfolder}
                onDelete={onDelete}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
