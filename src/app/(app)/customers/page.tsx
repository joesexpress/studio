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
      if (!record.customer) return;

      let customer = customersMap.get(record.customer);

      if (!customer) {
        customer = {
          id: record.customerId || record.customer, // Use customerId if available
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
        customer.totalBilled += record.total;
      }
      customer.records.push(record);

      // Use latest info
      customer.address = record.address;
      customer.phone = record.phone;

      customersMap.set(record.customer, customer);
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
    return <div>Loading customers...</div>;
  }
  
  return <CustomersClient customers={customers} />;
}
