import type {
  ApiResponse,
  ApiSuccess,
} from "@/shared/types/api-response.types";

const isDev = process.env.NODE_ENV === "development";

export type DashboardSettingsBootstrap = {
  name: string;
  email: string;
  image: string | null;
  phone: string;
  hasPasswordLogin: boolean;
  avatarR2UploadEnabled: boolean;
};

async function logResponseInDev(
  response: Response,
  method: string,
  url: string,
): Promise<void> {
  const clone = response.clone();
  const text = await clone.text();
  let body: unknown;
  if (!text) {
    body = undefined;
  } else {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }
  console.log("⬇️ [api-server] response", {
    method,
    url,
    status: response.status,
    body,
  });
}

/**
 * Server-only: GET /api/dashboard/settings with forwarded cookies.
 * Uses absolute origin from request headers (RSC / Route Handler).
 */
export async function fetchDashboardSettingsBootstrap(init: {
  protocol: string;
  host: string;
  cookie: string;
}): Promise<DashboardSettingsBootstrap> {
  const empty: DashboardSettingsBootstrap = {
    name: "",
    email: "",
    image: null,
    phone: "",
    hasPasswordLogin: false,
    avatarR2UploadEnabled: false,
  };

  const url = `${init.protocol}://${init.host}/api/dashboard/settings`;
  const method = "GET";

  if (isDev) {
    console.log("⬆️ [api-server] request", { method, url });
  }

  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      cookie: init.cookie,
    },
  });

  if (isDev) {
    await logResponseInDev(response, method, url);
  }

  if (!response.ok) {
    return empty;
  }

  const json =
    (await response.json()) as ApiResponse<DashboardSettingsBootstrap>;

  if (!json.success) {
    return empty;
  }

  return (json as ApiSuccess<DashboardSettingsBootstrap>).data;
}
