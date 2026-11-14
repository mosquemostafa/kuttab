export interface SelectQuery {
  q?: string;
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

export interface SelectTitleItem {
  id: string;
  title: string;
}

export interface SelectNameItem {
  id: string;
  name: string;
}
