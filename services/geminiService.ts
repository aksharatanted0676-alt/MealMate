
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Meal, NutritionReport, MacroNutrients, HealthGoal } from "../types";

const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
const ai = new GoogleGenAI({ apiKey });

const generateId = () => Math.random().toString(36).substr(2, 9);

const MEAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING, description: "Short appetizing description" },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step cooking instructions" },
    cookingTime: { type: Type.NUMBER, description: "Cooking time in minutes" },
    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER, description: "in grams" },
    carbs: { type: Type.NUMBER, description: "in grams" },
    fats: { type: Type.NUMBER, description: "in grams" }
  },
  required: ["name", "description", "ingredients", "instructions", "cookingTime", "difficulty", "calories", "protein", "carbs", "fats"]
};

export const generateMealPlan = async (user: UserProfile): Promise<Meal[]> => {
  try {
    const prompt = `Generate a daily meal plan (Breakfast, Lunch, Dinner) for:
    Name: ${user.name}
    Age: ${user.age}, Gender: ${user.gender}, Activity: ${user.activityLevel}
    Goal: ${user.goal}
    Diet: ${user.diet}
    Cuisine Preference: ${user.cuisine || 'Mixed'}
    Allergens to avoid: ${user.allergens.join(', ') || 'None'}
    Target Daily Calories: ${user.calorieTarget || 'Calculate appropriate amount'}
    
    Make it healthy, delicious, and varied. Include simple cooking instructions.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            breakfast: MEAL_SCHEMA,
            lunch: MEAL_SCHEMA,
            dinner: MEAL_SCHEMA
          },
          required: ["breakfast", "lunch", "dinner"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    
    const data = JSON.parse(text);

    return [
      { ...data.breakfast, type: 'Breakfast', id: generateId(), instructions: data.breakfast.instructions || [], macros: { calories: data.breakfast.calories, protein: data.breakfast.protein, carbs: data.breakfast.carbs, fats: data.breakfast.fats } },
      { ...data.lunch, type: 'Lunch', id: generateId(), instructions: data.lunch.instructions || [], macros: { calories: data.lunch.calories, protein: data.lunch.protein, carbs: data.lunch.carbs, fats: data.lunch.fats } },
      { ...data.dinner, type: 'Dinner', id: generateId(), instructions: data.dinner.instructions || [], macros: { calories: data.dinner.calories, protein: data.dinner.protein, carbs: data.dinner.carbs, fats: data.dinner.fats } },
    ];

  } catch (error) {
    console.error("Gemini Meal Plan Error:", error);
    throw error;
  }
};

export const swapMeal = async (currentMeal: Meal, user: UserProfile): Promise<Meal> => {
  try {
    const prompt = `Suggest a DIFFERENT alternative option for ${currentMeal.type} for ${user.name}.
    Current ignored option: ${currentMeal.name}.
    Goal: ${user.goal}. Diet: ${user.diet}. Cuisine: ${user.cuisine}.
    Return a single meal object.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: MEAL_SCHEMA
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    const data = JSON.parse(text);
    
    return {
       ...data,
       type: currentMeal.type,
       id: generateId(),
       macros: { 
         calories: data.calories, 
         protein: data.protein, 
         carbs: data.carbs, 
         fats: data.fats 
       }
    };
  } catch (error) {
    console.error("Swap Error", error);
    throw error;
  }
}

export const generateNutritionReport = async (meals: Meal[], user: UserProfile): Promise<NutritionReport> => {
  try {
    const mealSummaries = meals.map(m => `${m.type}: ${m.name} (${m.macros.calories}kcal, P:${m.macros.protein}, C:${m.macros.carbs}, F:${m.macros.fats})`).join('\n');
    
    const prompt = `Analyze this meal plan for ${user.name} (${user.age}, ${user.gender}, ${user.goal}).
    Meals:
    ${mealSummaries}
    
    Provide:
    1. A summary.
    2. Suggestions for improvement.
    3. A nutrition score (1-100) based on balance and goal alignment.
    4. Potential health risks (e.g. high sodium, low fiber).
    5. Suggested natural supplements (e.g. Omega-3, Whey).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            score: { type: Type.NUMBER },
            healthRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            supplements: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "suggestions", "score", "healthRisks", "supplements"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No report generated");
    const data = JSON.parse(text);

    const totalMacros: MacroNutrients = meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.macros.calories,
      protein: acc.protein + meal.macros.protein,
      carbs: acc.carbs + meal.macros.carbs,
      fats: acc.fats + meal.macros.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    return {
      totalCalories: totalMacros.calories,
      totalMacros,
      summary: data.summary,
      suggestions: data.suggestions,
      score: data.score,
      healthRisks: data.healthRisks,
      supplements: data.supplements
    };

  } catch (error) {
    console.error("Gemini Report Error:", error);
    throw error;
  }
};

export const generateGroceryList = async (meals: Meal[], servings: number = 1): Promise<string[]> => {
    const ingredients = meals.flatMap(m => m.ingredients);
    const uniqueIngredients = Array.from(new Set(ingredients));
    
    try {
        const prompt = `Given this list of ingredients: ${uniqueIngredients.join(', ')}. 
        Create a consolidated grocery shopping list for ${servings} person(s). 
        Adjust quantities logic accordingly. 
        Return a simple list of strings with quantities (e.g. "500g Chicken Breast").`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        items: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
         const text = response.text;
         if(!text) return uniqueIngredients;
         
         const data = JSON.parse(text);
         return data.items || uniqueIngredients;
    } catch (e) {
        console.error(e);
        return uniqueIngredients;
    }
}

export const generateMotivation = async (
  name: string,
  weight: number,
  energy: number,
  mood: number
): Promise<{ quote: string; advice: string; badges: string[] }> => {
  try {
    const prompt = `User ${name} log: Weight ${weight}, Energy ${energy}/10, Mood ${mood}/10.
    1. Motivational quote.
    2. One small actionable advice.
    3. Suggest 1-2 gamification badges they might have earned (e.g. "Consistency King", "Mood Master").`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING },
            advice: { type: Type.STRING },
            badges: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

     const text = response.text;
     if(!text) return { quote: "Keep going!", advice: "Drink more water.", badges: ["Starter"]};
     return JSON.parse(text);

  } catch (e) {
    return { quote: "You got this!", advice: "Consistency is key.", badges: [] };
  }
};

export const findGroceryStores = async (lat: number, lng: number): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find highly-rated grocery stores and supermarkets near this location.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      }
    });
    
    return response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  } catch (error) {
    console.error("Gemini Maps Error:", error);
    return [];
  }
};
