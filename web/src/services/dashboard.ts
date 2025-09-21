import { collection, getCountFromServer } from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";

export async function fetchTotals() {
  if (!isFirebaseConfigured()) {
    return { totalContacts: 0, totalMembers: 0, totalFirstTimers: 0, totalServices: 0 };
  }
  const db = getFirestoreDb();
  const [contacts, members, firstTimers, services] = await Promise.all([
    getCountFromServer(collection(db, "contacts")),
    getCountFromServer(collection(db, "members")),
    getCountFromServer(collection(db, "first_timers")),
    getCountFromServer(collection(db, "services")),
  ]);
  return {
    totalContacts: contacts.data().count,
    totalMembers: members.data().count,
    totalFirstTimers: firstTimers.data().count,
    totalServices: services.data().count,
  };
}


