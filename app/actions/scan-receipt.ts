"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const DEFAULT_CATEGORIES = [
    "Groceries", "Produce", "Dairy", "Meat", "Bakery", "Pantry", "Frozen",
    "Beverages", "Snacks", "Household", "Health", "Personal Care", "Clothing",
    "Dining", "Utilities", "Retail", "Other"
];

export async function processReceipt(imageUrl: string, userId: string) {
    if (!userId) throw new Error("Unauthorized");

    try {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        // 1. Fetch User Categories
        const userDocRef = adminDb.collection("users").doc(userId);
        const userDoc = await userDocRef.get();
        let userCategories = DEFAULT_CATEGORIES;

        if (userDoc.exists) {
            const data = userDoc.data();
            if (data?.categories && Array.isArray(data.categories)) {
                userCategories = data.categories;
            }
        } else {
            // Create user doc if not exists
            await userDocRef.set({ categories: DEFAULT_CATEGORIES }, { merge: true });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Use Gemini 3 Flash: Pro-level reasoning at high speed
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview", // "Pro-grade reasoning at Flash speeds"
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        storeName: { type: SchemaType.STRING },
                        date: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
                        totalAmount: { type: SchemaType.NUMBER },
                        category: { type: SchemaType.STRING, description: "Broad category of the entire receipt" },
                        items: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    name: { type: SchemaType.STRING },
                                    genericName: { type: SchemaType.STRING, description: "Standardized generic product name (e.g., 'Kroger Milk' -> 'Milk')" },
                                    price: { type: SchemaType.NUMBER },
                                    quantity: { type: SchemaType.NUMBER },
                                    unit: { type: SchemaType.STRING, description: "Unit (lb, oz, gal, kg, ea). Infer if missing." },
                                    category: {
                                        type: SchemaType.STRING,
                                        description: `Item category. Best match from: ${userCategories.join(", ")}. OR suggest a NEW category if none fit well.`
                                    }
                                },
                                required: ["name", "genericName", "price", "category"]
                            }
                        }
                    },
                    required: ["storeName", "date", "totalAmount", "items"]
                }
            }
        });

        // Fetch image and convert to base64
        const imageResp = await fetch(imageUrl);
        const imageBuffer = await imageResp.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString("base64");

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg",
                },
            },
            `Analyze this receipt image with high precision.
            
            EXTRACT THE FOLLOWING:
            1. **Store Name**: The merchant name.
            2. **Date**: Verified transaction date (YYYY-MM-DD).
            3. **Total Amount**: Final charge amount.
            4. **Broad Category**: Overall type (Groceries, Dining, etc.).
            5. **Items**: A detailed list of purchased items.
            
            FOR EACH ITEM:
            - **name**: The verbatim description from the receipt (cleaned of codes).
            - **genericName**: Identify what it actually is (e.g. "KS ALMOND BUTTER" -> "Almond Butter").
            - **price**: The *effective* price paid.
            - **quantity**: Count or weight.
            - **unit**: INFER the unit if not explicit.
              - If price is ~$1-6/lb for produce, infer "lb".
              - If item is liquid and large, infer "gal" or "oz".
              - Default to "ea" (each) for packaged goods.
            - **category**: Classify into the user's list or a new specific one.

            CRITICAL RULES FOR ACCURACY:
            1. **Discounts are NOT Items**: If a line says "Savings", "Discount", "Coupon", or "Member Price", it modifies the previous item. DO NOT list it as a separate item. SUBTRACT it from the item's price.
            2. **Merge Sale Lines**: "Item A $10.00" followed by "Sale -$2.00" -> One Item: "Item A", Price: 8.00.
            3. **Ignore Non-Product Lines**: Tax, Subtotal, Balance Due, "Change", "Cash", "Number of Items".
            4. **Units**: Be smart about units. "Bananas @ 0.69/lb" -> Unit: lb.
            `
        ]);

        const responseText = result.response.text();
        const output = JSON.parse(responseText);

        // 2. Auto-Learn New Categories
        const currentSet = new Set(userCategories.map(c => c.toLowerCase()));
        const newCategories = new Set<string>();

        if (output.items && Array.isArray(output.items)) {
            output.items.forEach((item: any) => {
                if (item.category) {
                    const cat = item.category.trim();
                    // Basic validation to prevent hallucinations or garbage
                    if (cat.length > 2 && cat.length < 30 && !currentSet.has(cat.toLowerCase())) {
                        // Title case helper
                        const formattedCat = cat.charAt(0).toUpperCase() + cat.slice(1);
                        newCategories.add(formattedCat);
                    }
                }
            });
        }

        if (newCategories.size > 0) {
            const newCatsArray = Array.from(newCategories);
            console.log("Auto-learning new categories:", newCatsArray);
            await userDocRef.update({
                categories: FieldValue.arrayUnion(...newCatsArray)
            });
        }

        // Save to Firestore
        const docRef = await adminDb.collection("receipts").add({
            userId,
            ...output,
            imageUrl,
            createdAt: new Date(),
            yearMonth: output.date ? output.date.substring(0, 7) : new Date().toISOString().substring(0, 7),
        });

        return { success: true, data: { ...output, id: docRef.id } };

    } catch (error) {
        console.error("Receipt Processing Error:", error);
        return { success: false, error: "Failed to process receipt: " + (error as Error).message };
    }
}
