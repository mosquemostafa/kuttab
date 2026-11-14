export const FCM_SOURCES = ["browser", "pwa"] as const;
export type FcmSource = (typeof FCM_SOURCES)[number];

export type FcmTokenRecord = {
  token: string;
  device: string;
  userAgent: string;
  os: string;
  source: FcmSource;
  topics: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
