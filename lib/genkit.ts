import "server-only";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

export const ai = genkit({
    plugins: [googleAI()],
    model: "gemini-flash-latest", // trying the generic alias provided by the API list
});
