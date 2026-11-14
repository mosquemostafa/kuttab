export type AdminAnnouncementAnalyticsDTO = {
  generatedAt: string;
  byType: Array<{
    type: string;
    count: number;
  }>;
  byActive: {
    active: number;
    notActive: number;
  };
  byStatus: {
    draft: number;
    published: number;
  };
};
