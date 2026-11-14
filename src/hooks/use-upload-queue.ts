"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  fetchUploadSignature,
  finalizeUpload,
  uploadToCloudinary,
} from "@/lib/assets/upload";
import type { AssetResponseDto } from "@/server/modules/assets/asset.dto";

const DEFAULT_FOLDER = "general";

type UploadFileStatus =
  | "idle"
  | "pending"
  | "uploading"
  | "finalizing"
  | "done"
  | "error";

type UploadAssetType = "image" | "file";

export type UploadQueueItem = {
  id: string;
  file: File;
  assetType: UploadAssetType;
  folder: string;
  tags: string[];
  status: UploadFileStatus;
  progress: number;
  error?: string;
  asset?: AssetResponseDto;
};

type UploadQueueAction =
  | {
      type: "add_files";
      items: UploadQueueItem[];
    }
  | {
      type: "set_status";
      id: string;
      status: UploadFileStatus;
    }
  | {
      type: "set_progress";
      id: string;
      progress: number;
    }
  | {
      type: "set_error";
      id: string;
      error: string;
    }
  | {
      type: "set_done";
      id: string;
      asset: AssetResponseDto;
    }
  | {
      type: "remove_file";
      id: string;
    }
  | {
      type: "set_tags";
      id: string;
      tags: string[];
    };

function generateUploadId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toResourceType(value: string | undefined): "image" | "video" | "raw" {
  if (value === "video" || value === "raw") {
    return value;
  }

  return "image";
}

function uploadQueueReducer(
  state: UploadQueueItem[],
  action: UploadQueueAction,
): UploadQueueItem[] {
  switch (action.type) {
    case "add_files":
      return [...state, ...action.items];

    case "set_status":
      return state.map((item) =>
        item.id === action.id
          ? {
              ...item,
              status: action.status,
              ...(action.status !== "error" ? { error: undefined } : {}),
            }
          : item,
      );

    case "set_progress":
      return state.map((item) =>
        item.id === action.id ? { ...item, progress: action.progress } : item,
      );

    case "set_error":
      return state.map((item) =>
        item.id === action.id
          ? {
              ...item,
              status: "error",
              error: action.error,
            }
          : item,
      );

    case "set_done":
      return state.map((item) =>
        item.id === action.id
          ? {
              ...item,
              status: "done",
              progress: 1,
              error: undefined,
              asset: action.asset,
            }
          : item,
      );

    case "remove_file":
      return state.filter((item) => item.id !== action.id);

    case "set_tags":
      return state.map((item) =>
        item.id === action.id ? { ...item, tags: action.tags } : item,
      );

    default:
      return state;
  }
}

export function useUploadQueue() {
  const [state, dispatch] = useReducer(
    uploadQueueReducer,
    [] as UploadQueueItem[],
  );
  const stateRef = useRef<UploadQueueItem[]>(state);
  const controllersRef = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const processFile = useCallback(async (item: UploadQueueItem) => {
    try {
      dispatch({ type: "set_status", id: item.id, status: "pending" });
      dispatch({ type: "set_progress", id: item.id, progress: 0 });

      const signature = await fetchUploadSignature({
        assetType: item.assetType,
        fileName: item.file.name,
        fileSize: item.file.size,
        mimeType: item.file.type,
        folder: item.folder,
        tags: item.tags,
      });

      dispatch({ type: "set_status", id: item.id, status: "uploading" });

      const cloudinaryResponse = await uploadToCloudinary(
        item.file,
        signature.upload,
        (progress) => {
          dispatch({
            type: "set_progress",
            id: item.id,
            progress,
          });
        },
        { signal: controllersRef.current.get(item.id)?.signal },
      );

      dispatch({ type: "set_status", id: item.id, status: "finalizing" });

      const finalized = await finalizeUpload(cloudinaryResponse.public_id, {
        resourceType: toResourceType(cloudinaryResponse.resource_type),
        format: cloudinaryResponse.format,
        width: cloudinaryResponse.width,
        height: cloudinaryResponse.height,
        bytes: cloudinaryResponse.bytes,
        originalFilename: cloudinaryResponse.original_filename,
        folder: cloudinaryResponse.folder ?? item.folder,
        tags: cloudinaryResponse.tags,
      });

      dispatch({ type: "set_done", id: item.id, asset: finalized });
    } catch (error) {
      dispatch({
        type: "set_error",
        id: item.id,
        error:
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again.",
      });
    } finally {
      controllersRef.current.delete(item.id);
    }
  }, []);

  const addFiles = useCallback(
    (
      files: File[] | FileList,
      assetType: UploadAssetType,
      folder = DEFAULT_FOLDER,
    ) => {
      const nextFiles = Array.from(files);
      if (nextFiles.length === 0) {
        return;
      }

      const items: UploadQueueItem[] = nextFiles.map((file) => ({
        id: generateUploadId(),
        file,
        assetType,
        folder,
        tags: [],
        status: "pending",
        progress: 0,
      }));

      dispatch({ type: "add_files", items });
    },
    [],
  );

  const startAll = useCallback(async () => {
    const pending = stateRef.current.filter(
      (item) => item.status === "pending",
    );

    pending.forEach((item) => {
      controllersRef.current.set(item.id, new AbortController());
    });

    await Promise.all(pending.map((item) => processFile(item)));
  }, [processFile]);

  const retryFile = useCallback(
    async (id: string) => {
      const item = stateRef.current.find((entry) => entry.id === id);
      if (!item) {
        return;
      }

      dispatch({ type: "set_status", id, status: "pending" });
      dispatch({ type: "set_progress", id, progress: 0 });
      controllersRef.current.set(id, new AbortController());
      await processFile({
        ...item,
        status: "pending",
        progress: 0,
        error: undefined,
        asset: undefined,
      });
    },
    [processFile],
  );

  const cancelFile = useCallback((id: string) => {
    const item = stateRef.current.find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    if (item.status === "uploading" || item.status === "finalizing") {
      const controller = controllersRef.current.get(id);
      controller?.abort();
      return;
    }

    dispatch({
      type: "set_error",
      id,
      error: "Upload canceled",
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    const controller = controllersRef.current.get(id);
    if (controller) {
      controller.abort();
      controllersRef.current.delete(id);
    }

    dispatch({ type: "remove_file", id });
  }, []);

  const updateTags = useCallback((id: string, tags: string[]) => {
    dispatch({ type: "set_tags", id, tags });
  }, []);

  return {
    state,
    addFiles,
    startAll,
    retryFile,
    cancelFile,
    removeFile,
    updateTags,
  };
}
