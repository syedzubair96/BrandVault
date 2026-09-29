import type { Folder } from "../../api/folders";

export interface FolderNode {
  folder: Folder;
  children: FolderNode[];
}

export function buildFolderTree(folders: Folder[]): FolderNode[] {
  const nodes = new Map<number, FolderNode>();
  for (const folder of folders) nodes.set(folder.id, { folder, children: [] });

  const roots: FolderNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.folder.HeadFolderId === null ? undefined : nodes.get(node.folder.HeadFolderId);
    // A missing parent means it isn't visible to us, so show the folder at the top level.
    (parent ? parent.children : roots).push(node);
  }

  const byName = (a: FolderNode, b: FolderNode) =>
    a.folder.FolderName.localeCompare(b.folder.FolderName, undefined, { sensitivity: "base" });
  const sort = (list: FolderNode[]) => {
    list.sort(byName);
    for (const node of list) sort(node.children);
  };
  sort(roots);
  return roots;
}

export interface FolderOption {
  folder: Folder;
  depth: number;
}

/** Tree order (parents before children), for pickers that show nesting by indentation. */
export function flattenTree(nodes: FolderNode[], depth = 0): FolderOption[] {
  return nodes.flatMap((node) => [{ folder: node.folder, depth }, ...flattenTree(node.children, depth + 1)]);
}

/** Folders from the root down to (and including) `id`, or [] if it isn't in the list. */
export function folderPath(folders: Folder[], id: number): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path: Folder[] = [];
  const seen = new Set<number>();
  let current = byId.get(id);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    path.unshift(current);
    current = current.HeadFolderId === null ? undefined : byId.get(current.HeadFolderId);
  }
  return path;
}
