
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server';
import { collection, getDocs, writeBatch, doc, Query } from 'firebase/firestore';

// This function recursively deletes documents in subcollections in batches of 500.
async function deleteCollection(db: any, collectionPath: string | Query, batchSize: number) {
    const collectionRef = typeof collectionPath === 'string' ? collection(db, collectionPath) : collectionPath;
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.size === 0) {
        return;
    }

    let batch = writeBatch(db);
    snapshot.docs.forEach((doc, index) => {
        batch.delete(doc.ref);
        if ((index + 1) % batchSize === 0) {
            batch.commit();
            batch = writeBatch(db);
        }
    });
    
    // Commit the remaining documents in the last batch
    await batch.commit();

    // Recurse on the same collection to ensure all documents are deleted
    if (snapshot.size === batchSize) {
       await deleteCollection(db, collectionPath, batchSize);
    }
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
    
    let count = 0;
    const batchSize = 500;

    // Delete all subcollections for each customer
    for (const customerDoc of customersSnapshot.docs) {
        const serviceRecordsPath = `customers/${customerDoc.id}/serviceRecords`;
        await deleteCollection(firestore, serviceRecordsPath, batchSize);
        count++;
    }

    // Now delete all the top-level customer documents
    await deleteCollection(firestore, customersRef, batchSize);

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
