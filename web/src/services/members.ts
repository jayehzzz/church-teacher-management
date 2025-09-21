import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { MemberRecord } from "@/types/member";

const MEMBERS_COLLECTION = "members";

export async function listMembers(): Promise<MemberRecord[]> {
  if (!isFirebaseConfigured()) {
    // Return mock data for testing when Firebase is not configured
    const mockData = [
      {
        id: "member-1",
        first_name: "John",
        surname: "Smith", 
        full_name: "John Smith",
        phone_number: "+44 7123 456789",
        email: "john.smith@email.com",
        address: "123 Church Lane, London SW1A 1AA",
        age: 35,
        member_type: "member" as const,
        member_status: "Regular",
        church_role: "Elder",
        marital_status: "Married",
        degree: "Bachelor's in Theology",
        employed: true,
        tithe_payer: true,
        baptised: true,
        schools: ["London Bible College", "King's College London"],
        date_of_birth: "1989-03-15",
        join_date: "2020-01-15",
        emergency_contact: {
          name: "Sarah Smith",
          phone: "+44 7123 456790",
          relationship: "Spouse"
        },
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z"
      },
      {
        id: "member-2",
        first_name: "Mary",
        surname: "Johnson",
        full_name: "Mary Johnson", 
        phone_number: "+44 7234 567890",
        email: "mary.johnson@email.com",
        address: "456 Faith Street, Manchester M1 1AA",
        age: 28,
        member_type: "member" as const,
        member_status: "Regular",
        church_role: "Worship Leader",
        marital_status: "Single",
        degree: "Master's in Music",
        employed: true,
        tithe_payer: true,
        baptised: true,
        schools: ["Royal Northern College of Music"],
        date_of_birth: "1996-07-22",
        join_date: "2021-03-10",
        emergency_contact: {
          name: "Patricia Johnson",
          phone: "+44 7234 567891",
          relationship: "Mother"
        },
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z"
      },
      {
        id: "member-3",
        first_name: "Peter",
        surname: "Brown",
        full_name: "Peter Brown",
        phone_number: "+44 7345 678901", 
        email: "peter.brown@email.com",
        address: "789 Hope Avenue, Birmingham B1 1AA",
        age: 42,
        member_type: "member" as const,
        member_status: "Regular",
        church_role: "Deacon",
        marital_status: "Married",
        degree: "MBA",
        employed: true,
        tithe_payer: true,
        baptised: true,
        schools: ["University of Birmingham", "Birmingham Business School"],
        date_of_birth: "1982-11-08",
        join_date: "2019-06-20",
        emergency_contact: {
          name: "Emma Brown",
          phone: "+44 7345 678902",
          relationship: "Spouse"
        },
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z"
      },
      {
        id: "member-4", 
        first_name: "Lisa",
        surname: "Davis",
        full_name: "Lisa Davis",
        phone_number: "+44 7456 789012",
        email: "lisa.davis@email.com",
        address: "321 Grace Road, Liverpool L1 1AA",
        age: 31,
        member_type: "member" as const,
        member_status: "Irregular",
        church_role: "Children's Ministry",
        marital_status: "Single",
        degree: "Bachelor's in Education",
        employed: true,
        tithe_payer: false,
        baptised: true,
        schools: ["Liverpool Hope University"],
        date_of_birth: "1993-05-14",
        join_date: "2022-09-05",
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z"
      },
      {
        id: "member-5",
        first_name: "Tom", 
        surname: "Wilson",
        full_name: "Tom Wilson",
        phone_number: "+44 7567 890123",
        email: "tom.wilson@email.com", 
        address: "654 Blessing Close, Leeds LS1 1AA",
        age: 26,
        member_type: "potential" as const,
        member_status: "Regular",
        marital_status: "Single",
        employed: false,
        tithe_payer: false,
        baptised: false,
        schools: ["University of Leeds"],
        date_of_birth: "1998-12-03",
        join_date: "2024-01-15",
        visitor_info: {
          first_visit_date: "2023-12-10",
          last_visit_date: "2024-01-15",
          total_visits: 8,
          promotion_eligible: true
        },
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z"
      }
    ] as MemberRecord[];
    
    return mockData;
  }
  
  const db = getFirestoreDb();
  const q = query(collection(db, MEMBERS_COLLECTION));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function createMember(input: Omit<MemberRecord, "id" | "full_name">) {
  if (!isFirebaseConfigured()) return "mock-id";
  
  // Compute full_name from first_name and surname
  const full_name = input.surname ? `${input.first_name} ${input.surname}` : input.first_name;
  
  const db = getFirestoreDb();
  const payload: any = {
    ...input,
    full_name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, MEMBERS_COLLECTION), payload);
  return ref.id;
}

export async function updateMember(id: string, patch: Partial<MemberRecord>) {
  if (!isFirebaseConfigured()) return;
  const db = getFirestoreDb();
  await updateDoc(doc(db, MEMBERS_COLLECTION, id), {
    ...patch,
    updatedAt: new Date().toISOString(),
  } as any);
}

export async function removeMember(id: string) {
  if (!isFirebaseConfigured()) return;
  const db = getFirestoreDb();
  await deleteDoc(doc(db, MEMBERS_COLLECTION, id));
}

// Function to sync members from Sunday service attendees
export async function syncMemberFromService(memberName: string, serviceDate: string, isFirstTimer: boolean = false): Promise<string | null> {
  try {
    if (!isFirebaseConfigured()) return null;
    
    const cleanName = memberName.trim();
    if (!cleanName) {
      console.warn("Empty member name provided to sync");
      return null;
    }
    
    console.log(`🔄 Syncing member: ${cleanName}`);
    
    // Check if member already exists (case-insensitive search)
    const existingMembers = await listMembers();
    const existingMember = existingMembers.find(m => {
      const fullName = m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`;
      return fullName.toLowerCase().trim() === cleanName.toLowerCase();
    });
    
    if (existingMember) {
      console.log(`✅ Member ${cleanName} already exists, updating visit info`);
      // Update visit info for existing member
      const currentVisits = existingMember.visitor_info?.total_visits ?? 0;
      const firstVisit = existingMember.visitor_info?.first_visit_date ?? serviceDate;
      const lastVisit = existingMember.visitor_info?.last_visit_date;
      
      // Only update if this service date is newer than the last recorded visit
      const shouldUpdate = !lastVisit || serviceDate > lastVisit;
      
      if (shouldUpdate) {
        const newVisitCount = currentVisits + 1;
        
        // Check if visitor should be promoted to potential/member
        let updatedMemberType = existingMember.member_type;
        let promotionEligible = existingMember.visitor_info?.promotion_eligible ?? false;
        
        if (existingMember.member_type === "visitor" && newVisitCount >= 2) {
          updatedMemberType = "potential";
          promotionEligible = true;
          console.log(`🎉 Promoting ${cleanName} from visitor to potential member (${newVisitCount} visits)`);
        } else if (existingMember.member_type === "potential" && newVisitCount >= 4) {
          updatedMemberType = "member";
          promotionEligible = true;
          console.log(`🎉 Promoting ${cleanName} from potential to full member (${newVisitCount} visits)`);
        }
        
        await updateMember(existingMember.id, {
          member_type: updatedMemberType,
          visitor_info: {
            first_visit_date: firstVisit,
            last_visit_date: serviceDate,
            total_visits: newVisitCount,
            promotion_eligible: promotionEligible
          }
        });
      }
      
      return null; // Indicates existing member was updated, not created
    }
    
    // Create new member from service attendee
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0];
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined;
    
    // Determine member type based on whether they were a first-timer
    const memberType = isFirstTimer ? "visitor" : "potential"; // First-timers start as visitors
    
    console.log(`➕ Creating new ${memberType}: ${firstName} ${surname || ''} ${isFirstTimer ? '(First Timer)' : '(Regular Attendee)'}`);
    
    // Create minimal member record
    const newMemberData = {
      first_name: firstName,
      surname: surname || "",
      phone_number: "", // Empty but required
      member_type: memberType as const,
      member_status: "Regular" as const,
      join_date: serviceDate,
      visitor_info: {
        first_visit_date: serviceDate,
        last_visit_date: serviceDate,
        total_visits: 1,
        promotion_eligible: false // Will be set to true after multiple visits
      }
    };
    
    const newMemberId = await createMember(newMemberData);
    console.log(`✅ Created member ${cleanName} with ID: ${newMemberId}`);
    
    return newMemberId; // Indicates new member was created
    
  } catch (error) {
    console.error(`❌ Error syncing member ${memberName}:`, error);
    throw error; // Re-throw to be caught by the bulk sync function
  }
}

// Function to get member by name (for service integration)
export async function getMemberByName(memberName: string): Promise<MemberRecord | null> {
  const members = await listMembers();
  return members.find(m => {
    const fullName = m.full_name ?? `${m.first_name}${m.surname ? ` ${m.surname}` : ""}`;
    return fullName.toLowerCase() === memberName.toLowerCase();
  }) || null;
}

// Function to get all members who are actual church members (not visitors)
export async function getChurchMembers(): Promise<MemberRecord[]> {
  const allMembers = await listMembers();
  return allMembers.filter(m => m.member_type === "member");
}

// Function to manually promote a member to the next level
export async function promoteMember(memberId: string): Promise<void> {
  const members = await listMembers();
  const member = members.find(m => m.id === memberId);
  
  if (!member) {
    throw new Error("Member not found");
  }
  
  let newMemberType = member.member_type;
  
  if (member.member_type === "visitor") {
    newMemberType = "potential";
  } else if (member.member_type === "potential") {
    newMemberType = "member";
  } else {
    throw new Error("Member is already at the highest level");
  }
  
  await updateMember(memberId, {
    member_type: newMemberType,
    visitor_info: {
      ...member.visitor_info,
      promotion_eligible: true
    }
  });
  
  console.log(`🎉 Manually promoted ${member.full_name} from ${member.member_type} to ${newMemberType}`);
}

// Function to find and clean up duplicate members
export async function findDuplicateMembers(): Promise<{ duplicates: MemberRecord[][]; total: number }> {
  const allMembers = await listMembers();
  const nameGroups = new Map<string, MemberRecord[]>();
  
  // Group members by normalized name
  for (const member of allMembers) {
    const fullName = member.full_name ?? `${member.first_name}${member.surname ? ` ${member.surname}` : ""}`;
    const normalizedName = fullName.toLowerCase().trim();
    
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    nameGroups.get(normalizedName)!.push(member);
  }
  
  // Find groups with duplicates
  const duplicates: MemberRecord[][] = [];
  let totalDuplicates = 0;
  
  for (const [name, members] of nameGroups.entries()) {
    if (members.length > 1) {
      duplicates.push(members);
      totalDuplicates += members.length - 1; // Count extras (keep 1, remove others)
    }
  }
  
  return { duplicates, total: totalDuplicates };
}


