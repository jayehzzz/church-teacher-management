export type MemberLifecycle = "visitor" | "potential" | "member";
export type MemberStatus = "Regular" | "Irregular" | "Dormant";

export interface MemberRecord {
  id: string;
  member_number?: string;
  first_name: string;
  surname?: string;
  full_name: string;
  display_name?: string;
  canonical_name?: string;
  name_variations?: string[];
  phone_number: string;
  address?: string;
  age?: number | string; // Allow both number and string for flexibility
  member_type: MemberLifecycle;
  member_status?: MemberStatus;
  church_role?: string;
  marital_status?: "Single" | "Married" | "Divorced" | "Widowed" | string;
  degree?: string;
  employed?: "Yes" | "No" | boolean;
  tithe_payer?: "Yes" | "No" | boolean;
  baptised?: "Yes" | "No" | boolean;
  schools?: string[];
  // Profile and tracking fields
  profile_image?: string;
  email?: string;
  date_of_birth?: string;
  join_date?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  ministry_involvement?: string[];
  spiritual_gifts?: string[];
  data_quality?: {
    score?: number;
    missing_fields?: string[];
    validation_flags?: Record<string, boolean>;
  };
  visitor_info?: {
    first_visit_date?: string;
    last_visit_date?: string;
    total_visits?: number;
    promotion_eligible?: boolean;
    follow_up_notes?: string;
  };
  duplicate_info?: {
    master_record_id?: string;
    merged_from_ids?: string[];
  };
  comments?: { id: string; text: string; timestamp: string; author?: string }[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export function computeFullName(first: string, surname?: string) {
  return surname ? `${first} ${surname}` : first;
}

