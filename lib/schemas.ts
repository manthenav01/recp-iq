import { z } from "genkit";

export const ReceiptItemSchema = z.object({
    name: z.string().describe("Name of the item"),
    price: z.number().describe("Price of the item"),
    quantity: z.number().optional().default(1).describe("Quantity"),
});

export const ReceiptSchema = z.object({
    storeName: z.string().describe("Name of the store"),
    date: z.string().describe("Date of purchase in YYYY-MM-DD format"),
    totalAmount: z.number().describe("Total amount paid"),
    category: z.enum(["Groceries", "Dining", "Utilities", "Retail", "Other"]).describe("Broad category of the expense"),
    items: z.array(ReceiptItemSchema).describe("List of line items"),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
