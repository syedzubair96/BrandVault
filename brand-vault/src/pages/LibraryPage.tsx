import {
  ChevronRight,
  FolderPlus,
  FolderSearch,
  FolderTree as FolderTreeIcon,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { listFolders, type Folder } from "../api/folders";
import { Loader } from "../components/Loader";
import { AssetPanel } from "../components/library/AssetPanel";
import { CreateFolderDialog } from "../components/library/CreateFolderDialog";
import { DeleteFolderDialog } from "../components/library/DeleteFolderDialog";
import { DeletedFolders } from "../components/library/DeletedFolders";
import { FolderTree } from "../components/library/FolderTree";
import { buildFolderTree, flattenTree, folderPath } from "../components/library/tree-utils";
import toast from "react-hot-toast";

function parseFolderId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function EmptymyFolders({ icon: Icon, title, text }: { icon: typeof FolderSearch; title: string; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <Icon className="size-10 text-slate-300" aria-hidden />
      <p className="mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function LibraryPage() {
  const { folderId: folderParam } = useParams();
  const selectedId = parseFolderId(folderParam);
  const navigate = useNavigate();

  const [myFolders, setMyFolders] = useState<Folder[] | null>(null);
  const [toggled, setToggled] = useState<ReadonlyMap<number, boolean>>(new Map());
  // undefined = closed, null = new top-level folder, Folder = new subfolder of it
  const [newFolderParent, setNewFolderParent] = useState<Folder | null | undefined>(undefined);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  // Bumped after a delete so the deleted-folders list refetches.
  const [deletedVersion, setDeletedVersion] = useState(0);

  const getFolders = () => {
    listFolders()
      .then((folders) => setMyFolders(folders))
      .catch(() => {
        toast.error("Error fetching folders. Please try again.");
      });
  };

  useEffect(() => {
    getFolders();
  }, []);

  const folders = useMemo(() => (myFolders && myFolders.length > 0 ? myFolders : []), [myFolders]);
  const tree = useMemo(() => buildFolderTree(folders), [folders]);
  const folderOptions = useMemo(() => flattenTree(tree), [tree]);
  const path = useMemo(
    () => (selectedId === null ? [] : folderPath(folders, selectedId)),
    [folders, selectedId],
  );
  const selected = path.at(-1) ?? null;

  const expanded = useMemo(() => {
    const ancestors = new Set(path.slice(0, -1).map((f) => f.id));
    return new Set(folders.filter((f) => toggled.get(f.id) ?? ancestors.has(f.id)).map((f) => f.id));
  }, [folders, path, toggled]);

  function setOpen(id: number, open: boolean) {
    setToggled((prev) => new Map(prev).set(id, open));
  }

  function handleSelect(id: number) {
    setOpen(id, true);
    navigate(`/library/${id}`);
  }

  function handleFolderCreated(folder: Folder) {
    setNewFolderParent(undefined);
    setMyFolders((prev) =>
      prev && prev.length > 0 ? [...prev, folder] : [folder],
    );
    if (folder.HeadFolderId !== null) setOpen(folder.HeadFolderId, true);
    navigate(`/library/${folder.id}`);
  }

  function handleFolderRestored(folder: Folder) {
    setMyFolders((prev) => (prev ? [...prev, folder] : [folder]));
    if (folder.HeadFolderId !== null) setOpen(folder.HeadFolderId, true);
  }

  function handleFolderDeleted(folder: Folder) {
    setFolderToDelete(null);
    setDeletedVersion((v) => v + 1);
    setMyFolders((prev) =>
      prev && prev.length > 0 ? prev.filter((f) => f.id !== folder.id) : [],
    );
    if (selected?.id === folder.id) {
      navigate(folder.HeadFolderId === null ? "/library" : `/library/${folder.HeadFolderId}`, {
        replace: true,
      });
    }
  }

  return (
    <div className="flex h-full">
      <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Asset Library</h1>
            <p className="text-xs text-slate-500">Folders</p>
          </div>
          <button
            type="button"
            onClick={() => setNewFolderParent(null)}
            disabled={!myFolders || myFolders.length === 0}
            aria-label="New folder"
            title="New folder"
            className="rounded-lg p-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FolderPlus className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {myFolders == undefined && (
            <div className="flex justify-center py-10">
              <Loader />
            </div>
          )}

          {myFolders && myFolders.length > 0 && tree.length === 0 && (
            <div className="flex flex-col items-center px-2 py-10 text-center">
              <p className="text-sm text-slate-500">No folders yet.</p>
              <button
                type="button"
                onClick={() => setNewFolderParent(null)}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <FolderPlus className="size-4" aria-hidden />
                Create folder
              </button>
            </div>
          )}

          {myFolders && myFolders.length > 0 && tree.length > 0 && (
            <FolderTree
              nodes={tree}
              selectedId={selected?.id ?? null}
              expanded={expanded}
              onSelect={handleSelect}
              onToggle={(id) => setOpen(id, !expanded.has(id))}
              onAddSubfolder={setNewFolderParent}
              onDelete={setFolderToDelete}
            />
          )}

          {showDeleted && (
            <section className="mt-4 border-t border-slate-200 pt-4">
              <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Deleted folders
              </h2>
              <DeletedFolders
                key={deletedVersion}
                activeFolders={folders}
                onRestored={handleFolderRestored}
              />
            </section>
          )}
        </div>

        <div className="border-t border-slate-200 px-5 py-3">
          <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-600">
            Show deleted folders
            <button
              type="button"
              role="switch"
              aria-checked={showDeleted}
              onClick={() => setShowDeleted((v) => !v)}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                showDeleted ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                  showDeleted ? "translate-x-4" : ""
                }`}
              />
            </button>
          </label>
        </div>
      </aside>

      <section className="min-w-0 flex-1 overflow-y-auto p-8">
        {myFolders == undefined ? null : selectedId === null ? (
          <EmptymyFolders
            icon={FolderTreeIcon}
            title="Select a folder"
            text="Pick a folder on the left to see the assets inside it."
          />
        ) : !selected ? (
          <EmptymyFolders
            icon={FolderSearch}
            title="Folder not found"
            text="It may have been deleted, or the link is wrong."
          />
        ) : (
          <>
            <header className="mb-6">
              {path.length > 1 && (
                <nav aria-label="Breadcrumb" className="mb-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  {path.slice(0, -1).map((f) => (
                    <span key={f.id} className="flex items-center gap-1">
                      <Link to={`/library/${f.id}`} className="hover:text-indigo-600 hover:underline">
                        {f.FolderName}
                      </Link>
                      <ChevronRight className="size-3" aria-hidden />
                    </span>
                  ))}
                </nav>
              )}
              <div className="flex items-center justify-between gap-4">
                <h2 className="truncate text-2xl font-bold text-slate-900">{selected.FolderName}</h2>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFolderParent(selected)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50"
                  >
                    <FolderPlus className="size-4" aria-hidden />
                    New subfolder
                  </button>
                  <button
                    type="button"
                    onClick={() => setFolderToDelete(selected)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    Delete
                  </button>
                </div>
              </div>
            </header>
            <AssetPanel
              key={selected.id}
              folderId={selected.id}
              folderName={selected.FolderName}
              folderOptions={folderOptions}
            />
          </>
        )}
      </section>

      {newFolderParent !== undefined && (
        <CreateFolderDialog
          parent={newFolderParent}
          onClose={() => setNewFolderParent(undefined)}
          onCreated={handleFolderCreated}
        />
      )}

      {folderToDelete && (
        <DeleteFolderDialog
          folder={folderToDelete}
          subfolderCount={folders.filter((f) => f.HeadFolderId === folderToDelete.id).length}
          onClose={() => setFolderToDelete(null)}
          onDeleted={handleFolderDeleted}
        />
      )}
    </div>
  );
}
