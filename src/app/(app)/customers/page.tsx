'use client';

import { useMemo } from 'react';
import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

function useCustomerData(serviceRecords: ServiceRecord[] | null): Customer[] {
  return useMemo(() => {
    if (!serviceRecords) return [];

    const customersMap: Map<string, Customer> = new Map();

    serviceRecords.forEach((record: ServiceRecord) => {
      if (!record.customerId) return;

      let customer = customersMap.get(record.customerId);

      if (!customer) {
        customer = {
          id: record.customerId,
          name: record.customer,
          address: record.address,
          phone: record.phone,
          totalJobs: 0,
          totalBilled: 0,
          records: [],
        };
      }

      customer.totalJobs += 1;
      if (record.status === 'Paid' || record.status === 'Owed') {
        const recordTotal = record.total || 0;
        customer.totalBilled += recordTotal;
      }
      customer.records.push(record);

      // Use latest info from the record
      customer.name = record.customer;
      customer.address = record.address;
      customer.phone = record.phone;

      customersMap.set(record.customerId, customer);
    });

    return Array.from(customersMap.values()).sort((a, b) => b.totalJobs - a.totalJobs);
  }, [serviceRecords]);
}


export default function CustomersPage() {
  const { firestore, user } = useFirebase();

  const serviceRecordsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // This fetches all records for the tech, we'll group them by customer on the client
    return query(collection(firestore, 'technicians', user.uid, 'serviceRecords'));
  }, [firestore, user]);

  const { data: serviceRecords, isLoading } = useCollection<ServiceRecord>(serviceRecordsQuery);
  const customers = useCustomerData(serviceRecords);

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading customers...</p></div>;
  }
  
  return <CustomersClient customers={customers} />;
}
