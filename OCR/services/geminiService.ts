
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_MODEL_NAME } from "../constants";

// Safely access process.env.API_KEY
const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY)
  ? process.env.API_KEY
  : undefined;

if (!API_KEY) {
  console.error("API_KEY environment variable not set or accessible. Gemini API calls will fail.");
  // alert("Gemini API Key is not configured. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || "MISSING_API_KEY" }); // Pass a string, even if it's "MISSING_API_KEY"

export const extractTextFromImage = async (base64ImageData: string, mimeType: string): Promise<string> => {
  if (!API_KEY) {
    // This error will be caught by App.tsx and displayed to the user.
    throw new Error("Gemini API Key is not configured or accessible. Please ensure the API_KEY environment variable is set.");
  }
  try {
    const imagePart: Part = {
      inlineData: {
        mimeType: mimeType,
        data: base64ImageData,
      },
    };
    const textPart: Part = {
      text: "Extract all text content from this image. If the image is blank or contains no discernible text, return an empty response or indicate that no text was found.",
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: [{ parts: [textPart, imagePart] }],
      config: {
        // Temperature 0 for more deterministic output for OCR
        temperature: 0.1,
      }
    });
    
    return response.text;
  } catch (error) {
    console.error("Error extracting text using Gemini API:", error);
    if (error instanceof Error) {
        // Prepend a more user-friendly message if it's a generic error from the API call itself
        if (error.message.includes("API Key") || (error as any).type === 'permission_denied') { // crude check
             return `Error extracting text: API Key invalid or missing permissions. Details: ${error.message}`;
        }
        return `Error extracting text: ${error.message}`;
    }
    return "An unknown error occurred while extracting text.";
  }
};
