"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ReceiptSchema } from "@/lib/schemas";
import { adminDb } from "@/lib/firebase-admin";

export async function processReceipt(imageUrl: string, userId: string) {
    if (!userId) throw new Error("Unauthorized");

    try {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const genAI = new GoogleGenerativeAI(apiKey);

        // Use the model available to the user
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        storeName: { type: SchemaType.STRING },
                        date: { type: SchemaType.STRING, description: "YYYY-MM-DD" },
                        totalAmount: { type: SchemaType.NUMBER },
                        category: { type: SchemaType.STRING, format: "enum", enum: ["Groceries", "Dining", "Utilities", "Retail", "Other"] },
                        items: {
                            type: SchemaType.ARRAY,
                            items: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    name: { type: SchemaType.STRING },
                                    price: { type: SchemaType.NUMBER },
                                    quantity: { type: SchemaType.NUMBER }
                                }
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
                    mimeType: "image/jpeg", // Assuming JPEG/PNG, 2.0 handles it well
                },
            },
            "Analyze this receipt image and extract the store name, date, total amount, category, and items and prices. Return JSON."
        ]);

        const responseText = result.response.text();
        const output = JSON.parse(responseText);

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
