import { GoogleGenAI } from "@google/genai";

// Initialize the client. API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the whiteboard content (which may include the screen share background)
 * and provides an explanation or solves the problem.
 * 
 * @param imageBase64 The base64 string of the captured canvas/video composite.
 * @param promptText Optional custom prompt.
 */
export const analyzeBoardContent = async (
  imageBase64: string,
  promptText: string = "Hãy phân tích hình ảnh này. Đây là bảng dạy học. Hãy giải thích nội dung trên bảng, giải toán nếu có, hoặc tóm tắt ý chính."
): Promise<string> => {
  try {
    // Remove header if present (e.g., "data:image/png;base64,")
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: promptText
          }
        ]
      },
      config: {
        // High budget not needed for this visual analysis, keeping it standard
        temperature: 0.4, 
      }
    });

    return response.text || "Không thể tạo phản hồi.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Có lỗi khi kết nối với AI. Vui lòng thử lại.");
  }
};