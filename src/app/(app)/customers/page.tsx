import { serviceRecords } from '@/lib/mock-data';
import type { Customer, ServiceRecord } from '@/lib/types';
import CustomersClient from '@/components/customers/CustomersClient';

async function getCustomerData(): Promise<Customer[]> {
  const customersMap: Map<string, Customer> = new Map();

  serviceRecords.forEach((record: ServiceRecord) => {
    let customer = customersMap.get(record.customer);

    if (!customer) {
      customer = {
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
}


export default async function CustomersPage() {
  const customers = await getCustomerData();
  return <CustomersClient customers={customers} />;
}
