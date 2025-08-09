// auditLog.js
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "./firebase.js";
// إضافة سجل جديد
export async function addAuditLog(data) {
  const id = Date.now().toString(); // ID فريد
  await setDoc(doc(db, "auditLogs", id), {
    ...data,
    timestamp: serverTimestamp(),
  });
}

// الاستماع لتحديثات السجل تلقائياً
export function listenToAuditLogs(callback) {
  const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((doc) => doc.data());
    callback(logs);
  });
}
