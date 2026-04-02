import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  runTransaction,
  Timestamp,
  getDocFromServer
} from "firebase/firestore";
import { db, auth } from "../firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}

// --- Users ---
export async function getUsers() {
  const path = 'users';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getUser(userId: string) {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// --- Captains ---
export async function getCaptains() {
  const path = 'captains';
  try {
    const snapshot = await getDocs(collection(db, path));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getCaptain(captainId: string) {
  const path = `captains/${captainId}`;
  try {
    const docSnap = await getDoc(doc(db, 'captains', captainId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// --- Bookings ---
export async function createBooking(data: any) {
  const path = 'bookings';
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', data.userId);
      const captainRef = doc(db, 'captains', data.captainId);
      
      const userDoc = await transaction.get(userRef);
      const captainDoc = await transaction.get(captainRef);
      
      if (!userDoc.exists()) throw new Error("User not found");
      if (!captainDoc.exists()) throw new Error("Captain not found");
      
      const userData = userDoc.data();
      const captainData = captainDoc.data();
      
      if (data.paymentMode === 'ONLINE' && userData.balance < data.finalAmount) {
        throw new Error("Insufficient wallet balance");
      }
      
      // Create Booking
      const bookingRef = doc(collection(db, 'bookings'));
      transaction.set(bookingRef, {
        ...data,
        createdAt: Timestamp.now()
      });
      
      // Update User Balance if ONLINE
      if (data.paymentMode === 'ONLINE') {
        const newBalance = userData.balance - data.finalAmount;
        transaction.update(userRef, { balance: newBalance });
        
        const userTxRef = doc(collection(db, 'userTransactions'));
        transaction.set(userTxRef, {
          userId: data.userId,
          type: 'DEBIT',
          amount: data.finalAmount,
          description: `Booking for ${data.basePrice}`,
          balanceAfter: newBalance,
          createdAt: Timestamp.now()
        });
      }
      
      // Update Captain Balance (Earnings)
      const commission = data.finalAmount * 0.2; // 20% commission
      const earnings = data.finalAmount - commission;
      const newCaptainBalance = captainData.balance + earnings;
      transaction.update(captainRef, { balance: newCaptainBalance });
      
      const captainTxRef = doc(collection(db, 'captainTransactions'));
      transaction.set(captainTxRef, {
        captainId: data.captainId,
        type: 'EARNING',
        amount: earnings,
        description: `Earnings from booking ${bookingRef.id}`,
        balanceAfter: newCaptainBalance,
        createdAt: Timestamp.now()
      });
      
      return bookingRef.id;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- Transactions ---
export function subscribeUserTransactions(userId: string, callback: (txs: any[]) => void) {
  const path = 'userTransactions';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export function subscribeCaptainTransactions(captainId: string, callback: (txs: any[]) => void) {
  const path = 'captainTransactions';
  const q = query(
    collection(db, path),
    where('captainId', '==', captainId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function addFunds(userId: string, amount: number) {
  const path = `users/${userId}`;
  try {
    await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User not found");
      
      const newBalance = userDoc.data().balance + amount;
      transaction.update(userRef, { balance: newBalance });
      
      const txRef = doc(collection(db, 'userTransactions'));
      transaction.set(txRef, {
        userId,
        type: 'CREDIT',
        amount,
        description: 'Added funds to wallet',
        balanceAfter: newBalance,
        createdAt: Timestamp.now()
      });
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getBookingsByCaptain(captainId: string) {
  const path = 'bookings';
  const q = query(
    collection(db, path),
    where('captainId', '==', captainId),
    orderBy('createdAt', 'desc')
  );
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAllBookings() {
  const path = 'bookings';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getFinancials() {
  try {
    const bookings = await getAllBookings();
    const captains = await getCaptains();
    
    if (!bookings || !captains) return null;

    const totalVolume = bookings.reduce((acc, b) => acc + (b.finalAmount || 0), 0);
    const totalRides = bookings.length;
    const onlineVolume = bookings.filter(b => b.paymentMode === 'WALLET').reduce((acc, b) => acc + (b.finalAmount || 0), 0);
    const cashVolume = bookings.filter(b => b.paymentMode === 'CASH').reduce((acc, b) => acc + (b.finalAmount || 0), 0);
    
    const totalBasePrice = bookings.reduce((acc, b) => acc + (b.basePrice || 0), 0);
    const totalExtras = bookings.reduce((acc, b) => acc + (b.waitingCharge + b.loadingCharge + b.longDistanceFee + b.lateNightFee || 0), 0);
    const totalDiscounts = bookings.reduce((acc, b) => acc + (b.discountAmount || 0), 0);
    
    const companyExpectedRevenue = (totalBasePrice * 0.2) + totalExtras - totalDiscounts;
    const outstandingCaptainDues = captains.reduce((acc, c) => acc + (c.balance < 0 ? c.balance : 0), 0);

    return {
      totalVolume,
      totalRides,
      onlineVolume,
      cashVolume,
      totalBasePrice,
      totalExtras,
      totalDiscounts,
      companyExpectedRevenue,
      outstandingCaptainDues: { _sum: { balance: outstandingCaptainDues } }
    };
  } catch (error) {
    console.error("Error calculating financials:", error);
    return null;
  }
}
