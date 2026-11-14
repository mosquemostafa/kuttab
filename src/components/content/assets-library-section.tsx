"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { AssetsUploadPanel } from "@/components/content/assets-upload-panel";
import {
  AssetsLibraryToolbar,
  type AssetsLibraryToolbarFilters,
} from "@/components/content/assets-library-toolbar";
import { AssetsGrid } from "@/components/content/assets-grid";
import { Button } from "@/components/ui/button";

export function AssetsLibrarySection() {
  const t = useTranslations("contentAssets");
  const [imageFilters, setImageFilters] = useState<AssetsLibraryToolbarFilters>(
    {
      resourceType: "image",
    },
  );
  const [fileFilters, setFileFilters] = useState<AssetsLibraryToolbarFilters>({
    resourceType: "raw",
  });
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";
  const tabParam = searchParams.get("tab");
  const activeTab: "images" | "files" =
    tabParam === "files" ? "files" : "images";

  useEffect(() => {
    if (tabParam === "images" || tabParam === "files") {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", "images");
    router.replace(`?${nextParams.toString()}`, { scroll: false });
  }, [router, searchParams, tabParam]);

  const setTab = (nextTab: "images" | "files") => {
    if (nextTab === activeTab) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", nextTab);
    router.replace(`?${nextParams.toString()}`, { scroll: false });
  };

  const triggerImageRefetch = () => {
    setImageRefreshKey((prev) => prev + 1);
  };

  const triggerFileRefetch = () => {
    setFileRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6" dir={dir}>
      <div className="flex gap-2 rounded-xl border p-2">
        <Button
          type="button"
          variant={activeTab === "images" ? "default" : "ghost"}
          onClick={() => setTab("images")}
        >
          {t("tabs.images")}
        </Button>
        <Button
          type="button"
          variant={activeTab === "files" ? "default" : "ghost"}
          onClick={() => setTab("files")}
        >
          {t("tabs.files")}
        </Button>
      </div>

      {activeTab === "images" ? (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImageUploadOpen((prev) => !prev)}
          >
            {isImageUploadOpen ? t("panel.hideUpload") : t("panel.showUpload")}
          </Button>

          {isImageUploadOpen ? (
            <AssetsUploadPanel
              assetType="image"
              onUploadCompleted={triggerImageRefetch}
            />
          ) : null}

          <section className="space-y-4 rounded-xl border p-4">
            <AssetsLibraryToolbar
              value={imageFilters}
              onChange={setImageFilters}
              lockedResourceType="image"
            />
            <AssetsGrid
              filters={imageFilters}
              forcedResourceType="image"
              refreshKey={imageRefreshKey}
              onDeleteCompleted={triggerImageRefetch}
            />
          </section>
        </>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsFileUploadOpen((prev) => !prev)}
          >
            {isFileUploadOpen ? t("panel.hideUpload") : t("panel.showUpload")}
          </Button>

          {isFileUploadOpen ? (
            <AssetsUploadPanel
              assetType="file"
              onUploadCompleted={triggerFileRefetch}
            />
          ) : null}

          <section className="space-y-4 rounded-xl border p-4">
            <AssetsLibraryToolbar
              value={fileFilters}
              onChange={setFileFilters}
              lockedResourceType="raw"
            />
            <AssetsGrid
              filters={fileFilters}
              forcedResourceType="raw"
              refreshKey={fileRefreshKey}
              onDeleteCompleted={triggerFileRefetch}
            />
          </section>
        </>
      )}
    </div>
  );
}
