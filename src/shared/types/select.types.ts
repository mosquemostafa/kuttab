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

export interface SelectUserQuery extends SelectQuery {
  role?: string;
}

export interface SelectUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string | null;
  role?: string | null;
}
