import { z } from "genkit";

export const ReceiptItemSchema = z.object({
    name: z.string().describe("Name of the item"),
    genericName: z.string().optional().describe("Standardized/Generic name of the item (e.g. 'Kroger Milk' -> 'Milk')"),
    price: z.number().describe("Price of the item"),
    unit: z.string().optional().describe("Unit of measurement (e.g. 'lb', 'oz', 'gal', 'ea'). If missing on receipt, INFER it from price/item type."),
    quantity: z.number().optional().default(1).describe("Quantity of units"),
    category: z.string().optional().default("Other").describe("Category of the item (e.g., Produce, Dairy, Meat, Household)"),
});

export const ReceiptSchema = z.object({
    storeName: z.string().describe("Name of the store"),
    date: z.string().describe("Date of purchase in YYYY-MM-DD format"),
    totalAmount: z.number().describe("Total amount paid"),
    category: z.string().describe("Broad category of the expense"),
    imageUrl: z.string().describe("URL of the receipt image"),
    items: z.array(ReceiptItemSchema).describe("List of line items"),
});

export type Receipt = z.infer<typeof ReceiptSchema>;
