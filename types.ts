
export enum HealthGoal {
  WEIGHT_LOSS = 'Weight Loss',
  MUSCLE_GAIN = 'Muscle Gain',
  GENERAL_FITNESS = 'General Fitness',
}

export enum DietaryPreference {
  VEGETARIAN = 'Vegetarian',
  VEGAN = 'Vegan',
  KETO = 'Keto',
  BALANCED = 'Balanced',
  NO_PREFERENCE = 'No Preference',
}

export enum ActivityLevel {
  SEDENTARY = 'Sedentary',
  MODERATE = 'Moderate',
  HIGH = 'High',
}

export enum AppTheme {
  DARK = 'Dark',
  LIGHT = 'Light',
  PASTEL = 'Pastel',
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  macros: MacroNutrients;
  description: string;
}

export interface NutritionReport {
  totalCalories: number;
  totalMacros: MacroNutrients;
  summary: string;
  suggestions: string[];
  score: number; // 1-100
  healthRisks: string[];
  supplements: string[];
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | '';
  goal: HealthGoal;
  diet: DietaryPreference;
  activityLevel: ActivityLevel;
  calorieTarget: number;
  mealTimes: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  allergens: string[];
  cuisine: string;
  theme: AppTheme;
}

export interface ProgressEntry {
  date: string;
  weight: number;
  energy: number;
  mood: number;
  photo?: string; // base64 data url
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
}

export type ScreenName =
  | 'WELCOME'
  | 'MEAL_PLAN'
  | 'GROCERY_LIST'
  | 'NUTRITION_REPORT'
  | 'PROGRESS_TRACKER'
  | 'FAVORITES'
  | 'SETTINGS';
