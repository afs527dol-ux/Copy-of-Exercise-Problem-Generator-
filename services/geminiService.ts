
import { GoogleGenAI, Type } from '@google/genai';
import { QuestionType, GeneratedQuestion } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getResponseSchema = (type: QuestionType) => {
  if (type === QuestionType.TrueFalse) {
    return {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The true/false question statement in Korean.",
          },
          answer: {
            type: Type.BOOLEAN,
            description: "The correct answer, true for 'O' and false for 'X'.",
          },
          explanation: {
            type: Type.STRING,
            description: "A brief explanation for the correct answer in Korean.",
          },
        },
        required: ["question", "answer", "explanation"],
      },
    };
  } else {
    return {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "The multiple-choice question in Korean.",
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 4 possible answers in Korean.",
          },
          correctAnswerIndex: {
            type: Type.INTEGER,
            description: "The 0-based index of the correct answer in the 'options' array.",
          },
          explanation: {
            type: Type.STRING,
            description: "A brief explanation for the correct answer in Korean.",
          },
        },
        required: ["question", "options", "correctAnswerIndex", "explanation"],
      },
    };
  }
};

export const generateQuestions = async (text: string, type: QuestionType, numQuestions: number): Promise<GeneratedQuestion[]> => {
  const questionTypeString = type === QuestionType.TrueFalse ? "True/False (O/X)" : "4-option multiple choice";
  
  const prompt = `Based on the following learning material, please generate ${numQuestions} questions in Korean. The question type should be ${questionTypeString}. For each question, provide a brief explanation for the correct answer. Do not use any markdown formatting in your response.

Learning Material:
---
${text}
---`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: getResponseSchema(type),
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("Received an empty response from the API.");
    }
    
    const parsedResponse = JSON.parse(jsonText);

    if (!Array.isArray(parsedResponse)) {
        throw new Error("API response is not in the expected array format.");
    }

    return parsedResponse as GeneratedQuestion[];

  } catch (error) {
    console.error("Error generating questions:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate questions. Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
};