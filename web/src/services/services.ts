import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, orderBy } from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { ServiceRecord } from "@/types/service";
import { computeAttendanceMetrics } from "@/types/service";

const SERVICES_COLLECTION = "services";

export async function listServices(): Promise<ServiceRecord[]> {
  if (!isFirebaseConfigured()) {
    // Return mock data for testing charts when Firebase is not configured
    return [
      {
        id: "mock-1",
        service_date: "2025-01-05",
        topic: "New Year, New Faith",
        service_type: "Sunday service",
        attendance_adults: 45,
        attendance_children: 12,
        converts: 3,
        tithers: 25,
        total_attendance: 57,
        attendance_first_timers: 8,
        attendees: ["John Smith", "Mary Johnson", "Peter Brown"],
        first_timers: [{ name: "Sarah Wilson" }, { name: "David Lee" }],
        created_at: "2025-01-05T10:00:00Z",
        updated_at: "2025-01-05T10:00:00Z"
      },
      {
        id: "mock-2", 
        service_date: "2025-01-12",
        topic: "Walking in Faith",
        service_type: "Sunday service",
        attendance_adults: 52,
        attendance_children: 15,
        converts: 2,
        tithers: 30,
        total_attendance: 67,
        attendance_first_timers: 5,
        attendees: ["John Smith", "Mary Johnson", "Peter Brown", "Lisa Davis"],
        first_timers: [{ name: "Mike Chen" }],
        created_at: "2025-01-12T10:00:00Z",
        updated_at: "2025-01-12T10:00:00Z"
      },
      {
        id: "mock-3",
        service_date: "2025-01-19", 
        topic: "God's Love",
        service_type: "Sunday service",
        attendance_adults: 48,
        attendance_children: 18,
        converts: 4,
        tithers: 28,
        total_attendance: 66,
        attendance_first_timers: 6,
        attendees: ["John Smith", "Mary Johnson", "Peter Brown", "Lisa Davis", "Tom Wilson"],
        first_timers: [{ name: "Anna Garcia" }, { name: "James Kim" }],
        created_at: "2025-01-19T10:00:00Z",
        updated_at: "2025-01-19T10:00:00Z"
      },
      {
        id: "mock-4",
        service_date: "2025-01-26",
        topic: "Hope in Christ", 
        service_type: "Sunday service",
        attendance_adults: 55,
        attendance_children: 20,
        converts: 1,
        tithers: 35,
        total_attendance: 75,
        attendance_first_timers: 4,
        attendees: ["John Smith", "Mary Johnson", "Peter Brown", "Lisa Davis", "Tom Wilson", "Emma Thompson"],
        first_timers: [{ name: "Robert Martinez" }],
        created_at: "2025-01-26T10:00:00Z", 
        updated_at: "2025-01-26T10:00:00Z"
      }
    ] as ServiceRecord[];
  }
  const db = getFirestoreDb();
  const q = query(collection(db, SERVICES_COLLECTION), orderBy("service_date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getService(id: string): Promise<ServiceRecord | null> {
  if (!isFirebaseConfigured()) return null;
  const db = getFirestoreDb();
  const ref = doc(db, SERVICES_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) } as ServiceRecord;
}

export type CreateServiceInput = Omit<ServiceRecord, "id" | "created_at" | "updated_at" | "attendance_first_timers" | "total_attendance" | "attendance_breakdown">;

export async function createService(input: CreateServiceInput) {
  if (!isFirebaseConfigured()) return "mock-id";
  const db = getFirestoreDb();
  const metrics = computeAttendanceMetrics(input.attendees ?? [], input.first_timers ?? []);
  // Remove undefined values before writing to Firestore
  const base: any = {
    ...input,
    ...metrics,
    attendance_adults: metrics.total_attendance,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const payload: any = Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined));
  const ref = await addDoc(collection(db, SERVICES_COLLECTION), payload);
  return ref.id;
}

export async function updateService(id: string, patch: Partial<ServiceRecord>) {
  if (!isFirebaseConfigured()) return;
  const db = getFirestoreDb();
  
  // If attendees or first_timers change, recompute derived metrics
  let next: any = { ...patch };
  if (patch.attendees !== undefined || patch.first_timers !== undefined) {
    // Get current data to merge with partial update
    const current = await getService(id);
    const attendees = patch.attendees !== undefined ? patch.attendees : (current?.attendees ?? []);
    const firstTimers = patch.first_timers !== undefined ? patch.first_timers : (current?.first_timers ?? []);
    
    console.log(`UpdateService ${id} - Attendees: ${attendees.length}, First timers: ${firstTimers.length}`);
    const metrics = computeAttendanceMetrics(attendees, firstTimers);
    next = { ...next, ...metrics, attendance_adults: metrics.total_attendance };
  }
  
  // Remove undefined values in patch
  const cleaned: any = Object.fromEntries(Object.entries({
    ...next,
    updated_at: new Date().toISOString(),
  }).filter(([, v]) => v !== undefined));
  await updateDoc(doc(db, SERVICES_COLLECTION, id), cleaned as any);
}

export async function removeService(id: string) {
  if (!isFirebaseConfigured()) return;
  const db = getFirestoreDb();
  await deleteDoc(doc(db, SERVICES_COLLECTION, id));
}


