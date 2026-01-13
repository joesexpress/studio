# **App Name**: HVAC Service Records Analyzer

## Core Features:

- Data Extraction: Automatically extract relevant information (date, technician, customer, address, phone, model, serial, filter size, freon type, labor hours, description of work, total cost, status) from service records documents (PDF, images) uploaded by the user using OCR
- Database Storage: Store extracted data in a structured Firestore database, ensuring easy access and management.
- Record Summarization: Use generative AI to produce a short summary (max 50 words) highlighting the key services performed, parts replaced, and any issues identified during the service. The tool must use its reasoning to find a comprehensive, but small number of most important parts of the service record.
- Search and Filtering: Enable users to search and filter service records by customer, date, technician, equipment model, or keywords found in the service description.
- Reporting: Generate summary reports of work performed with associated cost metrics to assess technician work performance or other productivity metrics.
- Document Viewer: Display the original document file, along with extracted data and the summary.

## Style Guidelines:

- Primary color: Strong blue (#3F51B5) to convey reliability and trustworthiness.
- Background color: Light gray (#F0F0F0) to provide a clean and neutral backdrop.
- Accent color: Analogous vibrant purple (#7E57C2) for highlighting key interactive elements.
- Body and headline font: 'Inter' (sans-serif) for clear, modern readability.
- Use a clear, tabular layout for presenting service record data, ensuring easy scanning and comparison.
- Employ simple, recognizable icons for different service types and data categories.
- Use subtle transitions and animations for loading data and displaying summaries, enhancing the user experience.