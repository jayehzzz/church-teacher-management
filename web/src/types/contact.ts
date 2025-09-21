export type ContactCategory = "responsive" | "non-responsive" | "has church" | "events only" | string;

export interface ContactRecord {
  id: string;
  name: string;
  phone: string;
  date?: string;
  category?: ContactCategory;
  invitedBy?: string;
  invitedById?: string;
  saved?: boolean;
  attendedChurch?: boolean;
  likelyToCome?: boolean;
  comments?: { id: string; text: string; timestamp: string; authorId?: string; authorName?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

