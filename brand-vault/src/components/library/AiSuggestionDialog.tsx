import { AlertTriangle, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AI_TAG_MAX_LENGTH,
  AI_TAGS_MAX,
  AI_TEXT_MAX_LENGTH,
  parseTags,
  saveAssetSuggestion,
  suggestAssetMetadata,
  type Asset,
} from "../../api/assets";
import { Loader } from "../Loader";
import { Modal } from "../Modal";

const textareaClass =
  "w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

type GenerateState = { status: "generating" } | { status: "error"; message: string } | { status: "ready" };

interface AiSuggestionDialogProps {
  asset: Asset;
  onClose: () => void;
  onSaved: (asset: Asset) => void;
}

function normalizeTag(tag: string) {
  return tag.trim().replace(/^#+/, "").replace(/\s+/g, " ").toLowerCase();
}

export function AiSuggestionDialog({ asset, onClose, onSaved }: AiSuggestionDialogProps) {
  const [state, setState] = useState<GenerateState>({ status: "generating" });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [usedImage, setUsedImage] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Dev StrictMode runs effects twice; this keeps it to one AI call.
  const started = useRef(false);

  const hasSavedMetadata = parseTags(asset.tags).length > 0 || Boolean(asset.description);

  const generate = (id: number) => {
    suggestAssetMetadata(id)
      .then((suggestion) => {
        setTags(suggestion.tags);
        setDescription(suggestion.description);
        setUsage(suggestion.usage_suggestion);
        setUsedImage(suggestion.used_image);
        setState({ status: "ready" });
      })
      .catch((err: unknown) => {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Could not generate a suggestion.",
        });
      });
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generate(asset.id);
  }, [asset.id]);

  function regenerate() {
    setSaveError(null);
    setState({ status: "generating" });
    generate(asset.id);
  }

  function addTag(raw: string) {
    const tag = normalizeTag(raw.replace(/,/g, ""));
    setTagInput("");
    if (!tag || tag.length > AI_TAG_MAX_LENGTH || tags.includes(tag) || tags.length >= AI_TAGS_MAX) return;
    setTags((prev) => [...prev, tag]);
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagInput);
    } else if (event.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  const trimmedDescription = description.trim();
  const trimmedUsage = usage.trim();
  const problem =
    tags.length === 0
      ? "Add at least one tag."
      : !trimmedDescription
        ? "Add a description."
        : !trimmedUsage
          ? "Add a usage suggestion."
          : null;

  async function handleSave() {
    if (problem) {
      setSaveError(problem);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      onSaved(
        await saveAssetSuggestion(asset.id, {
          tags,
          description: trimmedDescription,
          usage_suggestion: trimmedUsage,
        }),
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save the suggestion.");
      setSaving(false);
    }
  }

  return (
    <Modal title="AI tag suggestions" description={`For “${asset.name}”`} onClose={onClose} wide>
      {state.status === "generating" && (
        <div className="flex flex-col items-center py-10 text-center">
          <Loader />
          <p className="mt-4 text-sm text-slate-500">Generating tags and description…</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center py-8 text-center">
          <AlertTriangle className="size-8 text-red-500" aria-hidden />
          <p className="mt-3 font-semibold text-slate-900">Couldn't generate a suggestion</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">{state.message}</p>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Close
            </button>
            <button
              type="button"
              onClick={regenerate}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {state.status === "ready" && (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
            <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              {usedImage
                ? "The AI looked at the image and used the asset's name, type, URL, folder and your brand profile."
                : "The AI couldn't view this file, so this is based only on the asset's name, type, URL, folder and your brand profile."}{" "}
              Review and edit before saving.
              {hasSavedMetadata && " Saving replaces the asset's current tags and description."}
            </span>
          </p>

          <div>
            <label htmlFor="aiTagInput" className={labelClass}>
              Tags <span className="font-normal text-slate-400">({tags.length}/{AI_TAGS_MAX})</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-2.5 pr-1 text-xs text-slate-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    aria-label={`Remove tag ${tag}`}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
              {tags.length < AI_TAGS_MAX && (
                <input
                  id="aiTagInput"
                  type="text"
                  value={tagInput}
                  maxLength={AI_TAG_MAX_LENGTH}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => tagInput && addTag(tagInput)}
                  placeholder={tags.length === 0 ? "Type a tag and press Enter" : "Add tag…"}
                  className="min-w-24 flex-1 py-0.5 text-sm outline-none"
                />
              )}
            </div>
          </div>

          <div>
            <label htmlFor="aiDescription" className={labelClass}>
              Description
            </label>
            <textarea
              id="aiDescription"
              rows={3}
              maxLength={AI_TEXT_MAX_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={textareaClass}
            />
            <p className="mt-0.5 text-right text-xs text-slate-400">
              {description.length}/{AI_TEXT_MAX_LENGTH}
            </p>
          </div>

          <div>
            <label htmlFor="aiUsage" className={labelClass}>
              Usage suggestion
            </label>
            <textarea
              id="aiUsage"
              rows={2}
              maxLength={AI_TEXT_MAX_LENGTH}
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              className={textareaClass}
            />
            <p className="mt-0.5 text-right text-xs text-slate-400">
              {usage.length}/{AI_TEXT_MAX_LENGTH}
            </p>
          </div>

          {saveError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={regenerate}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw className="size-4" aria-hidden />
              Regenerate
            </button>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save to asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
