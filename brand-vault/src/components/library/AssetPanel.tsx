import {
  AlertTriangle,
  File,
  FileText,
  Film,
  Image as ImageIcon,
  Inbox,
  Pencil,
  Plus,
  Shapes,
  Sparkles,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { assetTypeName, listAssets, parseTags, type Asset } from "../../api/assets";
import { Loader } from "../Loader";
import { AiSuggestionDialog } from "./AiSuggestionDialog";
import { AssetDialog } from "./AssetDialog";
import { TrashAssetDialog } from "./TrashAssetDialog";
import type { FolderOption } from "./tree-utils";

const TYPE_ICONS: Record<string, LucideIcon> = {
  image: ImageIcon,
  video: Film,
  logo: Shapes,
  document: FileText,
  font: Type,
};

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; assets: Asset[] };

type DialogState =
  | { kind: "add" }
  | { kind: "edit"; asset: Asset }
  | { kind: "trash"; asset: Asset }
  | { kind: "ai"; asset: Asset }
  | null;

const actionClass =
  "rounded-lg bg-white/90 p-1.5 text-slate-600 shadow-sm ring-1 ring-slate-200 backdrop-blur hover:bg-white";

function AssetThumbnail({ asset }: { asset: Asset }) {
  const [failed, setFailed] = useState(false);
  const typeName = assetTypeName(asset.type);
  const Icon = TYPE_ICONS[typeName] ?? File;
  const showImage = (typeName === "image" || typeName === "logo") && asset.LogoURL && !failed;

  return (
    <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-t-xl bg-slate-50">
      {showImage ? (
        <img
          src={asset.LogoURL}
          alt=""
          loading="lazy"
          className="size-full object-contain p-2"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon className="size-10 text-slate-300" aria-hidden />
      )}
    </div>
  );
}

interface AssetCardProps {
  asset: Asset;
  onEdit: () => void;
  onTrash: () => void;
  onGenerateTags: () => void;
}

function AssetCard({ asset, onEdit, onTrash, onGenerateTags }: AssetCardProps) {
  const tags = parseTags(asset.tags);

  return (
    <li className="group relative flex flex-col rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <AssetThumbnail key={asset.LogoURL} asset={asset} />
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={onGenerateTags}
          aria-label={`Generate tags for ${asset.name}`}
          title="Generate tags with AI"
          className={`${actionClass} hover:text-violet-600`}
        >
          <Sparkles className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${asset.name}`}
          title="Edit"
          className={`${actionClass} hover:text-indigo-600`}
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onTrash}
          aria-label={`Delete ${asset.name}`}
          title="Delete"
          className={`${actionClass} hover:text-red-600`}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold text-slate-900" title={asset.name}>
          {asset.name}
        </p>
        <p className="text-xs text-slate-500">
          <span className="capitalize">{assetTypeName(asset.type)}</span> · Updated{" "}
          {dateFormat.format(new Date(asset.updatedAt))}
        </p>
        {asset.description && (
          <p className="line-clamp-2 text-xs text-slate-600" title={asset.description}>
            {asset.description}
          </p>
        )}
        {tags.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <li key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

interface AssetPanelProps {
  folderId: number;
  folderName: string;
  folderOptions: FolderOption[];
}

export function AssetPanel({ folderId, folderName, folderOptions }: AssetPanelProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [dialog, setDialog] = useState<DialogState>(null);

  const getAssets = (id: number) => {
    listAssets({ folderId: id })
      .then((assets) => setState({ status: "ready", assets }))
      .catch((err: unknown) => {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Could not load assets.",
        });
      });
  };

  useEffect(() => {
    getAssets(folderId);
  }, [folderId]);

  function updateAssets(update: (assets: Asset[]) => Asset[]) {
    setDialog(null);
    setState((prev) => (prev.status === "ready" ? { status: "ready", assets: update(prev.assets) } : prev));
  }

  function handleSaved(saved: Asset) {
    updateAssets((assets) => {
      const rest = assets.filter((a) => a.id !== saved.id);
      if (saved.FolderId !== folderId) return rest;
      return assets.some((a) => a.id === saved.id)
        ? assets.map((a) => (a.id === saved.id ? saved : a))
        : [saved, ...assets];
    });
  }

  function handleTrashed(trashed: Asset) {
    updateAssets((assets) => assets.filter((a) => a.id !== trashed.id));
  }

  const addButton = (
    <button
      type="button"
      onClick={() => setDialog({ kind: "add" })}
      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
    >
      <Plus className="size-4" aria-hidden />
      Add asset
    </button>
  );

  let content;
  if (state.status === "loading") {
    content = (
      <div className="flex justify-center py-16">
        <Loader />
      </div>
    );
  } else if (state.status === "error") {
    content = (
      <div className="flex flex-col items-center py-16 text-center">
        <AlertTriangle className="size-8 text-red-500" aria-hidden />
        <p className="mt-3 font-semibold text-slate-900">Couldn't load assets</p>
        <p className="mt-1 text-sm text-slate-500">{state.message}</p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            getAssets(folderId);
          }}
          className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Try again
        </button>
      </div>
    );
  } else if (state.assets.length === 0) {
    content = (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 py-16 text-center">
        <Inbox className="size-8 text-slate-300" aria-hidden />
        <p className="mt-3 font-semibold text-slate-900">This folder is empty</p>
        <p className="mb-5 mt-1 text-sm text-slate-500">Add your first asset to this folder.</p>
        {addButton}
      </div>
    );
  } else {
    content = (
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-4">
        {state.assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onEdit={() => setDialog({ kind: "edit", asset })}
            onTrash={() => setDialog({ kind: "trash", asset })}
            onGenerateTags={() => setDialog({ kind: "ai", asset })}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {state.status === "ready" &&
            `${state.assets.length} ${state.assets.length === 1 ? "asset" : "assets"}`}
        </p>
        {state.status === "ready" && state.assets.length > 0 && addButton}
      </div>

      {content}

      {(dialog?.kind === "add" || dialog?.kind === "edit") && (
        <AssetDialog
          folderId={folderId}
          folderName={folderName}
          folderOptions={folderOptions}
          asset={dialog.kind === "edit" ? dialog.asset : undefined}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
        />
      )}

      {dialog?.kind === "ai" && (
        <AiSuggestionDialog asset={dialog.asset} onClose={() => setDialog(null)} onSaved={handleSaved} />
      )}

      {dialog?.kind === "trash" && (
        <TrashAssetDialog asset={dialog.asset} onClose={() => setDialog(null)} onTrashed={handleTrashed} />
      )}
    </>
  );
}
