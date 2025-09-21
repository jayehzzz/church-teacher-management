import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { ContactRecord } from "@/types/contact";

const CONTACTS_COLLECTION = "contacts";

export async function listContacts(): Promise<ContactRecord[]> {
  if (!isFirebaseConfigured()) return [];
  const db = getFirestoreDb();
  const q = query(collection(db, CONTACTS_COLLECTION));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function createContact(input: Omit<ContactRecord, "id">) {
  if (!isFirebaseConfigured()) return "mock-id";
  const db = getFirestoreDb();
  const ref = await addDoc(collection(db, CONTACTS_COLLECTION), {
    ...input,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  return ref.id;
}

export async function updateContact(id: string, patch: Partial<ContactRecord>) {
  if (!isFirebaseConfigured()) return;
  const db = getFirestoreDb();
  await updateDoc(doc(db, CONTACTS_COLLECTION, id), { ...patch, updatedAt: new Date().toISOString() } as any);
}

export async function removeContact(id: string) {
  if (!isFirebaseConfigured()) return;
  const db = getFirestoreDb();
  await deleteDoc(doc(db, CONTACTS_COLLECTION, id));
}


