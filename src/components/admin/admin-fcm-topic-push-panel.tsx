"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Bell, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";

import { apiClient } from "@/lib/api/api-client";
import { UserRole } from "@/shared/enums/user-role.enum";
import type { SegmentDTO } from "@/shared/types/segment.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
type Target = "all" | "role" | "segment" | "custom";

const ROLE_ORDER: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPPORT,
  UserRole.CONTENT,
  UserRole.STUDENT,
  UserRole.PARENT,
  UserRole.USER,
];

export function AdminFcmTopicPushPanel() {
  const t = useTranslations();

  function roleLabel(value: UserRole): string {
    switch (value) {
      case UserRole.ADMIN:
        return t("adminUsers.roles.admin");
      case UserRole.SUPPORT:
        return t("adminUsers.roles.support");
      case UserRole.CONTENT:
        return t("adminUsers.roles.contentManager");
      case UserRole.STUDENT:
        return t("adminUsers.roles.student");
      case UserRole.PARENT:
        return t("adminUsers.roles.parent");
      case UserRole.USER:
      default:
        return t("adminUsers.roles.user");
    }
  }

  function customTopicLabel(topic: string): string {
    switch (topic) {
      case "product_updates":
        return t("adminNotifications.topicPush.customTopics.product_updates");
      default:
        return topic;
    }
  }

  const [target, setTarget] = useState<Target>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [segmentId, setSegmentId] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [availableCustomTopics, setAvailableCustomTopics] = useState<string[]>(
    [],
  );
  const [customTopicsLoading, setCustomTopicsLoading] = useState(false);
  const [segments, setSegments] = useState<SegmentDTO[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadSegments = useCallback(async () => {
    setSegmentsLoading(true);
    try {
      const { items } = await apiClient.segments.list({ limit: 100, page: 1 });
      setSegments(items);
      setSegmentId((prev) => prev || items[0]?.id || "");
    } catch {
      toast.error(t("adminNotifications.topicPush.loadSegmentsError"));
    } finally {
      setSegmentsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (target === "segment") {
      void loadSegments();
    }
  }, [target, loadSegments]);

  const loadAvailableCustomTopics = useCallback(async () => {
    setCustomTopicsLoading(true);
    try {
      const data = await apiClient.fcm.customTopics();
      setAvailableCustomTopics(data.availableTopics ?? []);
      setCustomTopic((prev) => prev || data.availableTopics?.[0] || "");
    } catch {
      toast.error(t("adminNotifications.topicPush.loadCustomTopicsError"));
    } finally {
      setCustomTopicsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (target === "custom") {
      void loadAvailableCustomTopics();
    }
  }, [target, loadAvailableCustomTopics]);

  const payloadBase = useMemo(() => {
    const out: {
      title: string;
      body: string;
      url?: string;
      imageUrl?: string;
    } = {
      title: title.trim(),
      body: body.trim(),
    };
    const u = url.trim();
    const img = imageUrl.trim();
    if (u.length > 0) out.url = u;
    if (img.length > 0) out.imageUrl = img;
    return out;
  }, [title, body, url, imageUrl]);

  const canSubmit =
    payloadBase.title.length > 0 &&
    payloadBase.body.length > 0 &&
    (target !== "segment" || segmentId.length > 0) &&
    (target !== "custom" || customTopic.length > 0);

  function openConfirm() {
    if (!canSubmit) {
      toast.error(t("adminNotifications.topicPush.validationRequired"));
      return;
    }
    setConfirmOpen(true);
  }

  async function executeSend() {
    setConfirmOpen(false);
    setSending(true);
    try {
      if (target === "all") {
        await apiClient.adminFcm.sendToAllUsers(payloadBase);
        toast.success(
          t("adminNotifications.topicPush.successAudience", {
            audience: t("adminNotifications.topicPush.targetAll"),
          }),
        );
        return;
      }
      if (target === "role") {
        await apiClient.adminFcm.sendToRole({
          ...payloadBase,
          role,
        });
        toast.success(
          t("adminNotifications.topicPush.successAudience", {
            audience: roleLabel(role),
          }),
        );
        return;
      }
      if (target === "custom") {
        await apiClient.adminFcm.sendToCustomTopic({
          ...payloadBase,
          topic: customTopic,
        });
        toast.success(
          t("adminNotifications.topicPush.successAudience", {
            audience: customTopic
              ? customTopicLabel(customTopic)
              : t("adminNotifications.topicPush.targetCustom"),
          }),
        );
        return;
      }
      await apiClient.adminFcm.sendToSegment({
        ...payloadBase,
        segmentId,
      });
      toast.success(
        t("adminNotifications.topicPush.successAudience", {
          audience:
            segments.find((s) => s.id === segmentId)?.name ??
            t("adminNotifications.topicPush.targetSegment"),
        }),
      );
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : t("adminNotifications.topicPush.sendError"),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-muted-foreground" aria-hidden />
            <CardTitle>{t("adminNotifications.topicPush.title")}</CardTitle>
          </div>
          <CardDescription>
            {t("adminNotifications.topicPush.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block text-muted-foreground">
              {t("adminNotifications.topicPush.targetLabel")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", t("adminNotifications.topicPush.targetAll")] as const,
                  [
                    "role",
                    t("adminNotifications.topicPush.targetRole"),
                  ] as const,
                  [
                    "segment",
                    t("adminNotifications.topicPush.targetSegment"),
                  ] as const,
                  [
                    "custom",
                    t("adminNotifications.topicPush.targetCustom"),
                  ] as const,
                ] satisfies [Target, string][]
              ).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={target === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTarget(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {target === "role" ? (
            <div className="space-y-2">
              <Label htmlFor="fcm-push-role">
                {t("adminNotifications.topicPush.roleLabel")}
              </Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger id="fcm-push-role" className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_ORDER.map((r) => (
                    <SelectItem key={r} value={r}>
                      {roleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {target === "segment" ? (
            <div className="space-y-2">
              <Label htmlFor="fcm-push-segment">
                {t("adminNotifications.topicPush.segmentLabel")}
              </Label>
              <Select
                value={segmentId}
                onValueChange={setSegmentId}
                disabled={segmentsLoading || segments.length === 0}
              >
                <SelectTrigger id="fcm-push-segment" className="max-w-md">
                  <SelectValue
                    placeholder={
                      segmentsLoading
                        ? t("adminNotifications.topicPush.loadingSegments")
                        : undefined
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {segments.length === 0 && !segmentsLoading ? (
                <p className="text-sm text-muted-foreground">
                  {t("adminNotifications.topicPush.noSegments")}
                </p>
              ) : null}
            </div>
          ) : null}

          {target === "custom" ? (
            <div className="space-y-2">
              <Label htmlFor="fcm-push-custom-topic">
                {t("adminNotifications.topicPush.customTopicLabel")}
              </Label>
              <Select
                value={customTopic}
                onValueChange={setCustomTopic}
                disabled={
                  customTopicsLoading || availableCustomTopics.length === 0
                }
              >
                <SelectTrigger id="fcm-push-custom-topic" className="max-w-md">
                  <SelectValue
                    placeholder={
                      customTopicsLoading
                        ? t("adminNotifications.topicPush.loadingCustomTopics")
                        : undefined
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableCustomTopics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {customTopicLabel(topic)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableCustomTopics.length === 0 && !customTopicsLoading ? (
                <p className="text-sm text-muted-foreground">
                  {t("adminNotifications.topicPush.noCustomTopics")}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="fcm-push-title">
              {t("adminNotifications.topicPush.fieldTitle")}
            </Label>
            <Input
              id="fcm-push-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fcm-push-body">
              {t("adminNotifications.topicPush.fieldBody")}
            </Label>
            <Textarea
              id="fcm-push-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fcm-push-url">
              {t("adminNotifications.topicPush.fieldUrl")}
            </Label>
            <Input
              id="fcm-push-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              maxLength={2000}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fcm-push-image">
              {t("adminNotifications.topicPush.fieldImageUrl")}
            </Label>
            <Input
              id="fcm-push-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              maxLength={2000}
              autoComplete="off"
            />
          </div>

          <Button
            type="button"
            disabled={!canSubmit || sending}
            onClick={openConfirm}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            {t("adminNotifications.topicPush.send")}
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("adminNotifications.topicPush.confirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {target === "all"
                ? t("adminNotifications.topicPush.confirmAll")
                : target === "role"
                  ? t("adminNotifications.topicPush.confirmRole", {
                      role: roleLabel(role),
                    })
                  : target === "custom"
                    ? t("adminNotifications.topicPush.confirmCustom", {
                        topic: customTopic
                          ? customTopicLabel(customTopic)
                          : customTopic,
                      })
                    : t("adminNotifications.topicPush.confirmSegment", {
                        name:
                          segments.find((s) => s.id === segmentId)?.name ??
                          segmentId,
                      })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("adminNotifications.topicPush.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => void executeSend()}>
              {t("adminNotifications.topicPush.confirmSend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
