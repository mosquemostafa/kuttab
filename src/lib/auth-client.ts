import { createAuthClient } from "better-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/config";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

function resolveSocialCallbackUrl(callbackPath?: string | null): string {
  const path =
    callbackPath?.trim() && callbackPath.trim().startsWith("/")
      ? callbackPath.trim()
      : DEFAULT_LOGIN_REDIRECT;

  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export const signInWithGithub = async (callbackPath?: string | null) => {
  await authClient.signIn.social({
    provider: "github",
    callbackURL: resolveSocialCallbackUrl(callbackPath),
  });
};

export const signInWithGoogle = async (callbackPath?: string | null) => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: resolveSocialCallbackUrl(callbackPath),
  });
};
