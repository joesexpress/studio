
'use client';

import type { Customer } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';
import { MOCK_CUSTOMERS } from '@/lib/mock-data';

export default function CustomersPage() {
  // Using mock data instead of Firestore
  const customers: Customer[] = MOCK_CUSTOMERS;

  return <CustomersClient customers={customers} />;
}
