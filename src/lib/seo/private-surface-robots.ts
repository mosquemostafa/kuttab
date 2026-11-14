import type { Metadata } from "next";

/** Use on auth, dashboards, and other non-public surfaces */
export const privateSurfaceRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};
