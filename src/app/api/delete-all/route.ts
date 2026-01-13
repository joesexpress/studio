
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

// This function recursively deletes documents in a subcollection.
async function deleteSubcollection(db: any, customerId: string, subcollectionName: string) {
    const subcollectionRef = collection(db, 'customers', customerId, subcollectionName);
    const snapshot = await getDocs(subcollectionRef);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


export async function POST(request: Request) {
  const { firestore } = initializeFirebase();
  if (!firestore) {
    return NextResponse.json({ error: 'Firestore is not initialized.' }, { status: 500 });
  }

  try {
    const customersRef = collection(firestore, 'customers');
    const customersSnapshot = await getDocs(customersRef);

    if (customersSnapshot.empty) {
        return NextResponse.json({ message: 'No data to delete.' }, { status: 200 });
    }
    
    // Using a batch to delete all top-level customers
    const batch = writeBatch(firestore);
    let count = 0;

    // We must also delete subcollections separately.
    for (const customerDoc of customersSnapshot.docs) {
        // Delete the serviceRecords subcollection for each customer
        await deleteSubcollection(firestore, customerDoc.id, 'serviceRecords');
        
        // Add the top-level customer document to the batch deletion
        batch.delete(customerDoc.ref);
        count++;
    }
    
    // Commit the batch deletion for the top-level customer documents
    await batch.commit();

    return NextResponse.json({ message: `${count} customers and their associated records have been deleted.` }, { status: 200 });

  } catch (error) {
    console.error('Error deleting all data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to delete all data.', details: errorMessage }, { status: 500 });
  }
}

// To prevent callers from trying to GET this route.
export async function GET() {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
