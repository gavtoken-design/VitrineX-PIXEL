
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
export const fileToPart = async (file: File): Promise<{ inlineData: { mimeType: string; data: string; } }> => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};

const handleApiResponse = (
    response: GenerateContentResponse,
    context: string
): string => {
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Request blocked: ${response.promptFeedback.blockReason}`);
    }

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
        const { mimeType, data } = imagePart.inlineData;
        return `data:${mimeType};base64,${data}`;
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        throw new Error(`Generation stopped: ${finishReason}`);
    }
    
    throw new Error(`No image returned for ${context}. ${response.text || ''}`);
};

export const generateMagicEdit = async (originalImage: File, userPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: `Edit this image: ${userPrompt}` }] },
    });
    return handleApiResponse(response, 'magic-edit');
};

export const generateEditedImage = async (originalImage: File, userPrompt: string, hotspot: { x: number, y: number }): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: `Edit at x:${hotspot.x}, y:${hotspot.y}: ${userPrompt}` }] },
    });
    return handleApiResponse(response, 'point-edit');
};

export const generateFilteredImage = async (originalImage: File, filterPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: `Apply filter: ${filterPrompt}` }] },
    });
    return handleApiResponse(response, 'filter');
};

export const generateAdjustedImage = async (originalImage: File, adjustmentPrompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const originalImagePart = await fileToPart(originalImage);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [originalImagePart, { text: `Adjust image: ${adjustmentPrompt}` }] },
    });
    return handleApiResponse(response, 'adjustment');
};

/**
 * FEATURE: GENERATE IMAGE
 * Uses Gemini 3 Pro Image for high-quality generation with aspect ratios.
 */
export const generateNewImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
            imageConfig: {
                aspectRatio: aspectRatio as any,
                imageSize: "1K"
            }
        }
    });
    return handleApiResponse(response, 'image-generation');
};

/**
 * FEATURE: ANALYZE IMAGE (Thinking Mode)
 * Uses Gemini 3 Pro with thinking for complex image understanding.
 */
export const analyzeImage = async (image: File, prompt: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imagePart = await fileToPart(image);
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text || "No analysis available.";
};

/**
 * FEATURE: ANIMATE IMAGE (Veo)
 * Uses Veo to turn an image into a video.
 */
export const animateImage = async (image: File, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const imagePart = await fileToPart(image);
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed: No download link.");
    
    return `${downloadLink}&key=${process.env.API_KEY}`;
};
