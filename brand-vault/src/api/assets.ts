import { apiRequest } from "./client";

export const ASSET_TYPES = {
  1: "image",
  2: "video",
  3: "logo",
  4: "document",
  5: "font",
} as const;

export type AssetTypeId = keyof typeof ASSET_TYPES;

export interface Asset {
  id: number;
  name: string;
  type: number;
  LogoURL: string;
  FolderId: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tags: string | null;
  description: string | null;
  usage_suggestion: string | null;
}

export type AssetSort = "updated_desc" | "name_asc";

export interface ListAssetsParams {
  folderId?: number;
  q?: string;
  sort?: AssetSort;
  trash?: boolean;
}

export interface CreateAssetInput {
  name: string;
  type: AssetTypeId;
  LogoURL: string;
  FolderId: number;
}

export function createAsset(input: CreateAssetInput) {
  return apiRequest<Asset>("/assets", { method: "POST", body: input });
}

export function updateAsset(id: number, input: Partial<CreateAssetInput>) {
  return apiRequest<Asset>(`/assets/${id}`, { method: "PATCH", body: input });
}

export interface AssetSuggestion {
  tags: string[];
  description: string;
  usage_suggestion: string;
}

export interface AssetSuggestionResult extends AssetSuggestion {
  /** Whether the AI looked at the image itself, not only the asset's text details. */
  used_image: boolean;
}

export const AI_TAGS_MAX = 8;
export const AI_TAG_MAX_LENGTH = 30;
export const AI_TEXT_MAX_LENGTH = 280;

/** Asks the backend AI for a suggestion. Nothing is saved until saveAssetSuggestion. */
export function suggestAssetMetadata(id: number) {
  return apiRequest<AssetSuggestionResult>(`/assets/${id}/ai-suggestion`, { method: "POST" });
}

export function saveAssetSuggestion(id: number, suggestion: AssetSuggestion) {
  return apiRequest<Asset>(`/assets/${id}/ai-metadata`, { method: "PUT", body: suggestion });
}

export function parseTags(tags: string | null): string[] {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function trashAsset(id: number) {
  return apiRequest<Asset>(`/assets/${id}/trash`, { method: "POST" });
}

export function assetTypeName(type: number): string {
  return ASSET_TYPES[type as AssetTypeId] ?? "file";
}

export function listAssets(params: ListAssetsParams = {}) {
  const query = new URLSearchParams();
  if (params.folderId !== undefined) query.set("folderId", String(params.folderId));
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  if (params.trash !== undefined) query.set("trash", String(params.trash));
  const qs = query.toString();
  return apiRequest<Asset[]>(`/assets${qs ? `?${qs}` : ""}`);
}
