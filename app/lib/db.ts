import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2WtQZ5kbdlzWqn0NDQj8mOvJ9OA4X5CQ",
  authDomain: "cryptographic-vault.firebaseapp.com",
  projectId: "cryptographic-vault",
  storageBucket: "cryptographic-vault.firebasestorage.app",
  messagingSenderId: "441800842840",
  appId: "1:441800842840:web:c168ed5ce302d6bfa1342d",
  measurementId: "G-F6CW8PJJ9Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export interface LogEntry {
  id: string;
  capsuleId: string;
  timestamp: number;
  author: string;
  type: "text" | "media";
  content: string;
}

export interface VaultEntry {
  id: string;
  capsuleId: string;
  timestamp: number;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio";
  author: string;
}

export const db = {
  checkCapsuleExists: async (capsuleId: string): Promise<boolean> => {
    try {
      const docRef = doc(firestore, "capsules", capsuleId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  createCapsule: async (capsuleId: string): Promise<void> => {
    try {
      await setDoc(doc(firestore, "capsules", capsuleId), {
        createdAt: Date.now()
      });
    } catch (e) {
      console.error("Error creating capsule", e);
    }
  },

  getLogs: async (capsuleId: string): Promise<LogEntry[]> => {
    try {
      const logsRef = collection(firestore, `capsules/${capsuleId}/logs`);
      const q = query(logsRef, orderBy("timestamp", "asc"));
      const snapshot = await getDocs(q);
      const logs: LogEntry[] = [];
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() } as LogEntry);
      });
      return logs;
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  
  addLog: async (capsuleId: string, entry: Omit<LogEntry, "id" | "capsuleId" | "timestamp">) => {
    const newLog = {
      ...entry,
      capsuleId,
      timestamp: Date.now()
    };
    try {
      const logsRef = collection(firestore, `capsules/${capsuleId}/logs`);
      const docRef = await addDoc(logsRef, newLog);
      return { id: docRef.id, ...newLog } as LogEntry;
    } catch (e) {
      console.error(e);
      return { id: Math.random().toString(), ...newLog } as LogEntry;
    }
  },

  getVaultEntries: async (capsuleId: string): Promise<VaultEntry[]> => {
    try {
      const vaultRef = collection(firestore, `capsules/${capsuleId}/vault`);
      const q = query(vaultRef, orderBy("timestamp", "asc"));
      const snapshot = await getDocs(q);
      const entries: VaultEntry[] = [];
      snapshot.forEach(doc => {
        entries.push({ id: doc.id, ...doc.data() } as VaultEntry);
      });
      return entries;
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  addVaultEntry: async (capsuleId: string, entry: Omit<VaultEntry, "id" | "capsuleId" | "timestamp"> | VaultEntry) => {
    try {
      const vaultRef = collection(firestore, `capsules/${capsuleId}/vault`);
      
      // If updating an existing entry
      if ("id" in entry) {
        const docRef = doc(firestore, `capsules/${capsuleId}/vault`, entry.id);
        await updateDoc(docRef, entry as any);
        return entry as VaultEntry;
      }

      // If creating a new entry
      const newEntry = {
        ...entry,
        capsuleId,
        timestamp: Date.now()
      };
      const docRef = await addDoc(vaultRef, newEntry);
      const finalEntry = { id: docRef.id, ...newEntry } as VaultEntry;

      // Automatically fire a log pulse
      const logContent = entry.mediaUrl 
        ? "A media file was secured in the vault." 
        : "An entry was recorded in the vault.";
        
      await db.addLog(capsuleId, {
        author: entry.author,
        type: "text",
        content: logContent
      });

      return finalEntry;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
};
