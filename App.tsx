
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { 
  HealthGoal, 
  DietaryPreference, 
  UserProfile, 
  Meal, 
  ScreenName, 
  NutritionReport,
  ActivityLevel,
  AppTheme,
  Badge
} from './types';
import { generateMealPlan, generateGroceryList, generateNutritionReport, generateMotivation, findGroceryStores, swapMeal } from './services/geminiService';
import { 
  ChefHat, 
  Utensils, 
  CheckCircle, 
  BarChart2, 
  ArrowLeft, 
  Trash2, 
  Heart, 
  ShoppingCart,
  Zap,
  Smile,
  Leaf,
  Target,
  ChevronRight,
  Flame,
  Droplets,
  Wind,
  User,
  X,
  BookOpen,
  MapPin,
  Navigation,
  RefreshCw,
  Clock,
  Volume2,
  Printer,
  Download,
  AlertTriangle,
  Award,
  Plus,
  Moon,
  Sun,
  Palette,
  Camera
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { jsPDF } from "jspdf";

const INITIAL_USER: UserProfile = {
  name: '',
  age: 25,
  gender: '',
  goal: HealthGoal.GENERAL_FITNESS,
  diet: DietaryPreference.NO_PREFERENCE,
  activityLevel: ActivityLevel.MODERATE,
  calorieTarget: 2000,
  mealTimes: { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
  allergens: [],
  cuisine: 'Mixed',
  theme: AppTheme.DARK
};

export default function App() {
  const [screen, setScreen] = useState<ScreenName>('WELCOME');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [loading, setLoading] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [groceryList, setGroceryList] = useState<string[]>([]);
  const [nutritionReport, setNutritionReport] = useState<NutritionReport | null>(null);
  const [favorites, setFavorites] = useState<Meal[]>([]);
  const [progress, setProgress] = useState<{ quote: string, advice: string, badges?: string[] } | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Meal | null>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [findingStores, setFindingStores] = useState(false);
  
  // New State Features
  const [servings, setServings] = useState(1);
  const [badges, setBadges] = useState<string[]>([]);
  const [photoProgress, setPhotoProgress] = useState<string[]>([]);
  const [showCustomMealModal, setShowCustomMealModal] = useState(false);
  const [customMealName, setCustomMealName] = useState('');

  // Apply Theme
  useEffect(() => {
    document.body.className = user.theme === AppTheme.DARK 
      ? 'bg-black text-slate-200' 
      : user.theme === AppTheme.LIGHT 
        ? 'bg-slate-50 text-slate-800' 
        : 'bg-pastel-blue text-slate-800';
  }, [user.theme]);

  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('mealMateFavorites');
      const savedUser = localStorage.getItem('mealMateUser');
      const savedPhotos = localStorage.getItem('mealMatePhotos');
      const savedBadges = localStorage.getItem('mealMateBadges');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedPhotos) setPhotoProgress(JSON.parse(savedPhotos));
      if (savedBadges) setBadges(JSON.parse(savedBadges));
    } catch (e) {
      console.error("Failed to load local storage", e);
    }
  }, []);

  const saveFavorites = (newFavs: Meal[]) => {
    setFavorites(newFavs);
    localStorage.setItem('mealMateFavorites', JSON.stringify(newFavs));
  };

  const saveUser = (u: UserProfile) => {
    setUser(u);
    localStorage.setItem('mealMateUser', JSON.stringify(u));
  }

  const handleGenerateMealPlan = async () => {
    if (!user.name) return alert("Please enter your name!");
    saveUser(user);
    setLoading(true);
    try {
      const plan = await generateMealPlan(user);
      setMeals(plan);
      setScreen('MEAL_PLAN');
    } catch (err) {
      alert("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async (mealToSwap: Meal) => {
    setLoading(true);
    try {
        const newMeal = await swapMeal(mealToSwap, user);
        setMeals(meals.map(m => m.id === mealToSwap.id ? newMeal : m));
    } catch (e) {
        alert("Could not swap meal.");
    } finally {
        setLoading(false);
    }
  };

  const handleCreateGroceryList = async () => {
    setLoading(true);
    try {
      const list = await generateGroceryList(meals, servings);
      setGroceryList(list);
      setScreen('GROCERY_LIST');
    } catch (err) {
      alert("Failed to create list.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async () => {
    setLoading(true);
    try {
      const report = await generateNutritionReport(meals, user);
      setNutritionReport(report);
      setScreen('NUTRITION_REPORT');
    } catch (err) {
      alert("Could not analyze nutrition.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (meal: Meal) => {
    const exists = favorites.find(f => f.id === meal.id);
    if (exists) {
      saveFavorites(favorites.filter(f => f.id !== meal.id));
    } else {
      saveFavorites([...favorites, meal]);
    }
  };

  const handleProgressSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const weight = Number(formData.get('weight'));
    const energy = Number(formData.get('energy'));
    const mood = Number(formData.get('mood'));
    
    setLoading(true);
    try {
      const result = await generateMotivation(user.name || "Friend", weight, energy, mood);
      setProgress(result);
      if (result.badges && result.badges.length > 0) {
        const newBadges = Array.from(new Set([...badges, ...result.badges]));
        setBadges(newBadges);
        localStorage.setItem('mealMateBadges', JSON.stringify(newBadges));
      }
    } catch (err) {
      alert("Failed to get advice.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const newPhotos = [result, ...photoProgress];
        setPhotoProgress(newPhotos);
        localStorage.setItem('mealMatePhotos', JSON.stringify(newPhotos));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFindStores = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }
    setFindingStores(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const results = await findGroceryStores(position.coords.latitude, position.coords.longitude);
            setStores(results);
            if (results.length === 0) alert("No stores found nearby.");
        } catch(e) {
            alert("Could not find stores");
        } finally {
            setFindingStores(false);
        }
    }, (error) => {
        console.error(error);
        alert("Unable to retrieve your location.");
        setFindingStores(false);
    });
  };

  const handleAddCustomMeal = () => {
    if(!customMealName) return;
    const newMeal: Meal = {
        id: Math.random().toString(),
        name: customMealName,
        type: 'Snack',
        description: 'User created custom meal',
        ingredients: [],
        instructions: [],
        cookingTime: 10,
        difficulty: 'Easy',
        macros: { calories: 300, protein: 10, carbs: 30, fats: 10 }
    };
    saveFavorites([...favorites, newMeal]);
    setCustomMealName('');
    setShowCustomMealModal(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Header background
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(139, 92, 246); // Violet
    doc.setFont("helvetica", "bold");
    doc.text("MealMate", 20, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text("Grocery Shopping List", 20, 30);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const date = new Date().toLocaleDateString();
    doc.text(`User: ${user.name}`, 150, 20);
    doc.text(`Servings: ${servings}`, 150, 25);
    doc.text(`Date: ${date}`, 150, 30);

    // Line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 42, 190, 42);

    // Content
    let y = 55;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Helper to strip emojis for PDF safety
    const cleanText = (str: string) => str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');

    groceryList.forEach((item) => {
       const text = cleanText(item);
       
       // Draw checkbox
       doc.setDrawColor(100, 100, 100);
       doc.rect(20, y-4, 4, 4);
       
       // Text
       doc.text(text, 30, y);
       
       y += 10;
       
       // Page break
       if (y > 270) {
           doc.addPage();
           y = 20;
       }
    });

    doc.save(`MealMate_List_${date.replace(/\//g, '-')}.pdf`);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser.");
    }
  };

  // --- Components ---

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center text-white">
      <div className="relative">
        <div className="w-24 h-24 border-8 border-slate-800 rounded-full"></div>
        <div className="w-24 h-24 border-8 border-violet-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ChefHat className="text-violet-500 animate-bounce" size={32} />
        </div>
      </div>
      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500 mt-8 animate-pulse">Cooking...</h3>
    </div>
  );

  const RecipeModal = ({ meal, onClose }: { meal: Meal; onClose: () => void }) => {
    if (!meal) return null;
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in no-print" onClick={onClose}>
        <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-800" onClick={e => e.stopPropagation()}>
          <div className="p-6 md:p-8 bg-gradient-to-r from-violet-900/30 to-fuchsia-900/30 border-b border-slate-800 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-3">
                 <span className="text-3xl">{getMealIcon(meal.type)}</span>
                 <span className="text-sm font-bold uppercase tracking-wider text-violet-300 bg-violet-900/50 px-3 py-1 rounded-full">{meal.type}</span>
                 <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${meal.difficulty === 'Easy' ? 'border-green-500 text-green-400' : 'border-orange-500 text-orange-400'}`}>{meal.difficulty}</span>
                 <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> {meal.cookingTime}m</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">{meal.name}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-red-400 transition-colors">
              <X size={24} />
            </button>
          </div>
          
          <div className="overflow-y-auto p-6 md:p-8 space-y-8">
             <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/50 p-4 rounded-2xl">
                    <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Utensils size={16}/> Ingredients</h3>
                    <ul className="text-sm text-slate-300 space-y-1">
                        {meal.ingredients.map((ing, i) => <li key={i}>• {ing}</li>)}
                    </ul>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-2xl">
                     <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Flame size={16}/> Macros</h3>
                     <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="bg-slate-900 rounded-lg p-2"><div className="text-lg font-bold text-white">{meal.macros.calories}</div><div className="text-[10px] text-slate-500 uppercase">Kcal</div></div>
                        <div className="bg-slate-900 rounded-lg p-2"><div className="text-lg font-bold text-white">{meal.macros.protein}</div><div className="text-[10px] text-slate-500 uppercase">Prot</div></div>
                        <div className="bg-slate-900 rounded-lg p-2"><div className="text-lg font-bold text-white">{meal.macros.carbs}</div><div className="text-[10px] text-slate-500 uppercase">Carb</div></div>
                        <div className="bg-slate-900 rounded-lg p-2"><div className="text-lg font-bold text-white">{meal.macros.fats}</div><div className="text-[10px] text-slate-500 uppercase">Fat</div></div>
                     </div>
                 </div>
             </div>

             <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl text-white flex items-center gap-2"><ChefHat size={20}/> Instructions</h3>
                    <button onClick={() => speakText(meal.instructions.join('. '))} className="text-xs font-bold flex items-center gap-1 bg-violet-600 px-3 py-1.5 rounded-full text-white hover:bg-violet-500">
                        <Volume2 size={14}/> Read Aloud
                    </button>
                </div>
                <ol className="space-y-4">
                {meal.instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-4 group">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 font-bold text-sm border-2 border-slate-700 group-hover:border-violet-500 group-hover:text-violet-300 transition-colors">
                        {idx + 1}
                    </span>
                    <p className="text-slate-300 mt-1 leading-relaxed font-medium">{step}</p>
                    </li>
                ))}
                </ol>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const getMealIcon = (type: string) => {
    switch(type) {
      case 'Breakfast': return '🥞';
      case 'Lunch': return '🥗';
      case 'Dinner': return '🥘';
      default: return '🍱';
    }
  };

  // --- Screens ---

  const renderWelcome = () => (
    <div className="flex flex-col justify-center items-center py-6 md:py-12 animate-fade-in">
      <div className="max-w-xl w-full text-center mb-10">
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 mb-4 tracking-tight">MealMate</h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium">Smart Diet & Meal Planner</p>
      </div>

      <div className="max-w-2xl w-full bg-slate-900/80 backdrop-blur-md p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-black/50 border border-slate-800 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label-text">Name</label>
              <input value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="input-field" placeholder="John Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="label-text">Age</label>
                   <input type="number" value={user.age} onChange={e => setUser({...user, age: Number(e.target.value)})} className="input-field" />
                </div>
                <div>
                   <label className="label-text">Gender</label>
                   <select value={user.gender} onChange={e => setUser({...user, gender: e.target.value as any})} className="input-field">
                       <option value="">Select</option>
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                       <option value="Other">Other</option>
                   </select>
                </div>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
             <div>
                <label className="label-text">Goal</label>
                <select value={user.goal} onChange={e => setUser({...user, goal: e.target.value as HealthGoal})} className="input-field">
                    {Object.values(HealthGoal).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>
             <div>
                <label className="label-text">Activity Level</label>
                <select value={user.activityLevel} onChange={e => setUser({...user, activityLevel: e.target.value as ActivityLevel})} className="input-field">
                    {Object.values(ActivityLevel).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
             </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
             <div>
                <label className="label-text">Diet</label>
                <select value={user.diet} onChange={e => setUser({...user, diet: e.target.value as DietaryPreference})} className="input-field">
                    {Object.values(DietaryPreference).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
             </div>
             <div>
                <label className="label-text">Cuisine Preference</label>
                <select value={user.cuisine} onChange={e => setUser({...user, cuisine: e.target.value})} className="input-field">
                    <option value="Mixed">Mixed (Surprise Me)</option>
                    <option value="Italian">Italian</option>
                    <option value="Mexican">Mexican</option>
                    <option value="Asian">Asian</option>
                    <option value="Indian">Indian</option>
                    <option value="Mediterranean">Mediterranean</option>
                </select>
             </div>
        </div>

        <div>
            <label className="label-text">Daily Calorie Target</label>
            <div className="flex items-center gap-4">
                <input type="range" min="1200" max="4000" step="50" value={user.calorieTarget} onChange={e => setUser({...user, calorieTarget: Number(e.target.value)})} className="flex-1" />
                <span className="font-bold text-violet-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 w-20 text-center">{user.calorieTarget}</span>
            </div>
        </div>

        <Button fullWidth onClick={handleGenerateMealPlan} className="py-4 text-xl mt-4">Start Planning <ChevronRight/></Button>
      </div>
    </div>
  );

  const renderMealPlan = () => (
    <div className="space-y-8 pb-20 animate-fade-in-up">
      <div className="flex justify-between items-end px-2">
        <div>
           <h2 className="header-title">Today's Menu</h2>
           <p className="sub-header">For {user.name} • {user.calorieTarget} kcal target</p>
        </div>
        <button onClick={handleGenerateMealPlan} className="btn-secondary">
           <Zap size={20}/> New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {meals.map((meal, index) => {
          const isFav = favorites.some(f => f.id === meal.id);
          return (
            <div key={meal.id} className="relative group perspective-1000">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-pink-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className={`relative bg-slate-900 rounded-[2.4rem] p-7 h-full flex flex-col border border-slate-800 transition-transform duration-300 group-hover:-translate-y-2 shadow-2xl`}>
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl filter drop-shadow-md">{getMealIcon(meal.type)}</span>
                        <div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">{meal.type}</span>
                            <span className="text-xs font-bold text-violet-400">{meal.cookingTime} min • {meal.difficulty}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleSwapMeal(meal)} title="Swap Meal" className="p-2 bg-slate-800 rounded-xl hover:text-blue-400 transition-colors border border-slate-700"><RefreshCw size={18}/></button>
                        <button onClick={() => toggleFavorite(meal)} className="p-2 bg-slate-800 rounded-xl hover:text-red-500 transition-colors border border-slate-700">
                            <Heart size={18} className={isFav ? "fill-red-500 text-red-500" : "text-slate-500"} />
                        </button>
                    </div>
                 </div>

                 <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{meal.name}</h3>
                 <p className="text-sm text-slate-400 mb-6 flex-1 font-medium">{meal.description}</p>
                 
                 <div className="flex gap-2 mb-6">
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-2 text-center border border-slate-800">
                        <div className="text-sm font-bold text-white">{meal.macros.calories}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Kcal</div>
                    </div>
                    <div className="flex-1 bg-slate-800/50 rounded-xl p-2 text-center border border-slate-800">
                        <div className="text-sm font-bold text-white">{meal.macros.protein}g</div>
                        <div className="text-[10px] text-slate-500 uppercase">Prot</div>
                    </div>
                 </div>

                 <button onClick={() => setViewingRecipe(meal)} className="w-full py-3 rounded-2xl bg-slate-800 border-2 border-slate-700 text-slate-300 font-bold text-sm hover:border-violet-500 hover:text-violet-300 transition-all flex items-center justify-center gap-2">
                   <BookOpen size={18}/> View Recipe
                 </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto pt-8 no-print">
        <Button variant="secondary" onClick={handleCreateGroceryList} className="!py-5 !rounded-2xl md:col-start-2 text-lg">
          <ShoppingCart size={22} /> Shop
        </Button>
        <Button variant="primary" onClick={handleViewReport} className="!py-5 !rounded-2xl text-lg">
          <BarChart2 size={22} /> Analysis
        </Button>
      </div>
    </div>
  );

  const renderGroceryList = () => (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex items-center justify-between mb-4 no-print">
        <div className="flex items-center gap-4">
            <button onClick={() => setScreen('MEAL_PLAN')} className="back-btn"><ArrowLeft size={28} /></button>
            <h2 className="header-title">Shopping List</h2>
        </div>
        <div className="flex gap-2">
            <button onClick={downloadPDF} className="p-3 bg-slate-800 rounded-xl hover:text-white text-slate-400 transition-colors" title="Download PDF"><Download size={20}/></button>
            <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 border border-slate-700">
                <User size={16} className="text-slate-400"/>
                <select value={servings} onChange={(e) => { setServings(Number(e.target.value)); handleCreateGroceryList(); }} className="bg-transparent text-white font-bold py-2 outline-none cursor-pointer">
                    <option value={1}>1 Person</option>
                    <option value={2}>2 People</option>
                    <option value={4}>4 People</option>
                    <option value={6}>6 People</option>
                </select>
            </div>
        </div>
      </div>

      <Card className="min-h-[50vh] !p-6 md:!p-10 bg-white text-black shadow-xl print:shadow-none print:border-none">
        <div className="hidden print:block mb-8">
            <h1 className="text-4xl font-bold mb-2">MealMate Grocery List</h1>
            <p className="text-gray-500">Plan for {user.name} • {servings} Servings</p>
        </div>
        {groceryList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <ShoppingCart size={48} className="opacity-50 mb-4"/>
                <p className="font-bold">List is empty</p>
            </div>
        ) : (
            <ul className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            {groceryList.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 py-2 border-b border-gray-100 print:border-gray-300">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-md print:block hidden"></div>
                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 print:hidden" />
                    <span className="text-lg font-medium">{item}</span>
                </li>
            ))}
            </ul>
        )}
      </Card>

      <div className="mt-8 border-t border-slate-800 pt-8 no-print">
          <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin size={20} className="text-red-500" /> Nearby Stores
              </h3>
              <Button variant="outline" onClick={handleFindStores} disabled={findingStores} className="!py-2.5 !px-5 text-sm rounded-xl">
                  {findingStores ? 'Locating...' : 'Find Stores'}
              </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stores.map((chunk, i) => {
                  const mapData = chunk.web || chunk.maps;
                  if (!mapData) return null;
                  return (
                      <a key={i} href={mapData.uri} target="_blank" rel="noreferrer" className="block p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800 transition-all flex items-center gap-4">
                          <div className="bg-red-900/20 p-3 rounded-xl text-red-500"><MapPin size={20} /></div>
                          <div>
                              <h4 className="font-bold text-slate-200 line-clamp-1">{mapData.title}</h4>
                              <span className="text-xs text-slate-500 font-bold">Open in Maps</span>
                          </div>
                      </a>
                  )
              })}
          </div>
      </div>
    </div>
  );

  const renderNutritionReport = () => {
    if (!nutritionReport) return null;
    const data = [
      { name: 'Protein', value: nutritionReport.totalMacros.protein, color: '#8B5CF6' },
      { name: 'Carbs', value: nutritionReport.totalMacros.carbs, color: '#F472B6' },
      { name: 'Fats', value: nutritionReport.totalMacros.fats, color: '#F59E0B' },
    ];

    // Mock weekly data for chart
    const weeklyData = [
       { day: 'M', cal: user.calorieTarget - 200 },
       { day: 'T', cal: user.calorieTarget + 100 },
       { day: 'W', cal: user.calorieTarget - 50 },
       { day: 'T', cal: nutritionReport.totalCalories },
       { day: 'F', cal: 0 },
       { day: 'S', cal: 0 },
       { day: 'S', cal: 0 },
    ];

    return (
      <div className="space-y-6 pb-20 max-w-6xl mx-auto animate-fade-in">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setScreen('MEAL_PLAN')} className="back-btn"><ArrowLeft size={28} /></button>
          <h2 className="header-title">Nutrition Report</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="flex flex-col items-center !p-6 bg-slate-900 border-slate-800 shadow-xl h-80">
                        <h3 className="font-bold text-slate-400 mb-4 uppercase text-xs tracking-wider">Macro Breakdown</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{background: '#1E293B', border: 'none', borderRadius: '12px', color: '#fff'}} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center mt-4">
                            <span className="text-3xl font-black text-white block">{nutritionReport.totalCalories}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Kcal</span>
                        </div>
                    </Card>

                    <Card className="!p-6 bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
                         <div>
                            <h3 className="font-bold text-slate-400 mb-4 uppercase text-xs tracking-wider">Nutrition Score</h3>
                            <div className="flex items-center gap-4">
                                <div className={`text-6xl font-black ${nutritionReport.score > 80 ? 'text-green-500' : nutritionReport.score > 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {nutritionReport.score}
                                </div>
                                <div className="text-sm text-slate-500 font-bold leading-tight">
                                    out of 100<br/>
                                    <span className="text-slate-300">{nutritionReport.score > 80 ? 'Excellent!' : 'Needs Tweaking'}</span>
                                </div>
                            </div>
                         </div>
                         <div className="mt-6">
                             <h3 className="font-bold text-slate-400 mb-2 uppercase text-xs tracking-wider">Health Risks Detected</h3>
                             {nutritionReport.healthRisks.length > 0 ? (
                                 <div className="space-y-2">
                                     {nutritionReport.healthRisks.map((risk, i) => (
                                         <div key={i} className="flex items-center gap-2 text-xs text-orange-300 bg-orange-900/20 p-2 rounded-lg border border-orange-900/30">
                                             <AlertTriangle size={14}/> {risk}
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <div className="text-sm text-green-400 flex items-center gap-2"><CheckCircle size={16}/> No major risks detected.</div>
                             )}
                         </div>
                    </Card>
                </div>
                
                <Card className="bg-slate-900 border-slate-800 !p-6">
                    <h3 className="font-bold text-slate-400 mb-6 uppercase text-xs tracking-wider">Weekly Calorie Trend</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="day" stroke="#94A3B8" tick={{fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: '#1E293B'}} contentStyle={{background: '#0F172A', border: '1px solid #334155', borderRadius: '8px'}} />
                                <Bar dataKey="cal" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                 <Card className="bg-slate-900 border-slate-800 !p-6">
                    <h3 className="font-bold text-slate-400 mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><Zap size={16}/> AI Insights</h3>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">{nutritionReport.summary}</p>
                    <div className="space-y-3">
                        {nutritionReport.suggestions.map((s, i) => (
                            <div key={i} className="text-xs font-bold text-slate-300 bg-slate-800 p-3 rounded-xl border border-slate-700 flex gap-3">
                                <div className="min-w-[4px] bg-violet-500 rounded-full"></div>
                                {s}
                            </div>
                        ))}
                    </div>
                 </Card>

                 <Card className="bg-slate-900 border-slate-800 !p-6">
                    <h3 className="font-bold text-slate-400 mb-4 uppercase text-xs tracking-wider flex items-center gap-2"><Plus size={16}/> Suggested Supplements</h3>
                    <div className="flex flex-wrap gap-2">
                        {nutritionReport.supplements.map((sup, i) => (
                            <span key={i} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-900/20 text-emerald-400 border border-emerald-900/30">{sup}</span>
                        ))}
                    </div>
                 </Card>
            </div>
        </div>
      </div>
    );
  };

  const renderProgressTracker = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <h2 className="header-title px-2">Progress Tracker</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
            <Card className="!p-8 shadow-2xl bg-gradient-to-br from-slate-900 to-black border-slate-800">
            <h3 className="text-xl font-bold text-white mb-6">Daily Check-in</h3>
            <form onSubmit={handleProgressSubmit} className="space-y-8">
                <div>
                    <label className="label-text">Weight (kg)</label>
                    <input name="weight" type="number" step="0.1" required placeholder="0.0" className="w-full text-5xl font-black bg-transparent border-none outline-none text-white placeholder:text-slate-700 p-0" />
                </div>
                
                <div className="space-y-4">
                    <label className="label-text">Energy (1-10)</label>
                    <input name="energy" type="range" min="1" max="10" defaultValue="5" className="w-full accent-violet-500" />
                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Low</span><span>High</span></div>
                </div>

                <div className="space-y-4">
                    <label className="label-text">Mood (1-10)</label>
                    <input name="mood" type="range" min="1" max="10" defaultValue="5" className="w-full accent-pink-500" />
                    <div className="flex justify-between text-xs font-bold text-slate-500"><span>Bad</span><span>Good</span></div>
                </div>

                <Button type="submit" fullWidth className="py-4 shadow-xl">Log & Get Advice</Button>
            </form>
            </Card>

            {progress && (
                <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2rem] p-8 text-white shadow-xl animate-fade-in-up">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-full"><Smile size={32}/></div>
                        <div>
                            <p className="font-bold opacity-80 uppercase text-xs tracking-wider mb-1">Daily Wisdom</p>
                            <h4 className="text-xl font-bold leading-tight">"{progress.quote}"</h4>
                        </div>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl backdrop-blur-sm">
                        <p className="font-medium text-sm">{progress.advice}</p>
                    </div>
                </div>
            )}
        </div>

        <div className="space-y-8">
             {/* Gamification Badges */}
             <Card className="!p-6 bg-slate-900 border-slate-800">
                 <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Award size={20} className="text-yellow-500"/> Badges Earned</h3>
                 <div className="grid grid-cols-4 gap-4">
                     {badges.length > 0 ? badges.map((b, i) => (
                         <div key={i} className="aspect-square bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-2 text-center border border-slate-700">
                             <Award size={24} className="text-yellow-400 mb-2"/>
                             <span className="text-[10px] font-bold text-slate-300 leading-tight">{b}</span>
                         </div>
                     )) : (
                         <div className="col-span-4 text-center py-4 text-slate-500 text-sm font-medium">Log progress to earn badges!</div>
                     )}
                 </div>
             </Card>

             {/* Photo Progress */}
             <Card className="!p-6 bg-slate-900 border-slate-800">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2"><Camera size={20}/> Photo Journey</h3>
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors">
                        <Plus size={18}/>
                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/>
                    </label>
                 </div>
                 <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                     {photoProgress.length > 0 ? photoProgress.map((src, i) => (
                         <img key={i} src={src} alt="Progress" className="w-24 h-32 object-cover rounded-xl border-2 border-slate-700 flex-shrink-0" />
                     )) : (
                         <div className="w-full py-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl">Upload your first photo</div>
                     )}
                 </div>
             </Card>
        </div>
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
         <h2 className="header-title flex items-center gap-3">
             <Heart className="text-red-500 fill-red-500" size={28}/> Favorites
         </h2>
         <Button variant="secondary" onClick={() => setShowCustomMealModal(true)} className="!py-2 !px-4 text-sm !rounded-xl">
             <Plus size={16}/> Add Custom
         </Button>
      </div>
      
      {favorites.length === 0 ? (
        <div className="empty-state">
          <Heart size={64} className="opacity-20 stroke-2 mb-4" />
          <p className="font-bold text-xl opacity-50">No favorite meals yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {favorites.map((meal) => (
             <div key={meal.id} className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl border border-slate-800 flex flex-col group hover:border-violet-500/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-4xl">{getMealIcon(meal.type)}</span>
                    <button onClick={() => toggleFavorite(meal)} className="text-slate-600 hover:text-red-500 p-2"><Trash2 size={20}/></button>
                </div>
                <h4 className="font-bold text-white text-lg mb-1 line-clamp-1">{meal.name}</h4>
                <p className="text-xs text-slate-500 mb-4">{meal.macros.calories} kcal • {meal.type}</p>
                <button onClick={() => setViewingRecipe(meal)} className="mt-auto w-full py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">View Recipe</button>
             </div>
           ))}
        </div>
      )}

      {showCustomMealModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-md border border-slate-800">
                  <h3 className="text-xl font-bold text-white mb-4">Add Custom Meal</h3>
                  <input 
                    placeholder="Meal Name (e.g. Grandma's Pie)" 
                    value={customMealName}
                    onChange={e => setCustomMealName(e.target.value)}
                    className="input-field mb-6"
                    autoFocus
                  />
                  <div className="flex gap-4">
                      <Button variant="ghost" fullWidth onClick={() => setShowCustomMealModal(false)}>Cancel</Button>
                      <Button fullWidth onClick={handleAddCustomMeal}>Save Meal</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );

  const renderSettings = () => (
     <div className="space-y-8 max-w-xl mx-auto pb-20 animate-fade-in">
       <h2 className="header-title px-2">Profile & Settings</h2>
       
       <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-800 space-y-8">
         <div>
            <label className="label-text">Display Name</label>
            <input value={user.name} onChange={e => setUser({...user, name: e.target.value})} className="input-field" />
         </div>

         <div>
             <label className="label-text">Theme Preference</label>
             <div className="grid grid-cols-3 gap-3">
                 {[AppTheme.DARK, AppTheme.LIGHT, AppTheme.PASTEL].map(t => (
                     <button 
                        key={t}
                        onClick={() => setUser({...user, theme: t})}
                        className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${user.theme === t ? 'border-violet-500 bg-violet-900/20 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}
                     >
                         {t === AppTheme.DARK && <Moon size={16} className="mx-auto mb-1"/>}
                         {t === AppTheme.LIGHT && <Sun size={16} className="mx-auto mb-1"/>}
                         {t === AppTheme.PASTEL && <Palette size={16} className="mx-auto mb-1"/>}
                         {t}
                     </button>
                 ))}
             </div>
         </div>

         <div className="grid md:grid-cols-2 gap-6">
            <div>
                <label className="label-text">Health Goal</label>
                <select value={user.goal} onChange={e => setUser({...user, goal: e.target.value as HealthGoal})} className="input-field">
                    {Object.values(HealthGoal).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <div>
                <label className="label-text">Diet Type</label>
                <select value={user.diet} onChange={e => setUser({...user, diet: e.target.value as DietaryPreference})} className="input-field">
                    {Object.values(DietaryPreference).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
         </div>

         <div>
             <label className="label-text">Food Allergens (Comma separated)</label>
             <input 
                value={user.allergens.join(', ')} 
                onChange={e => setUser({...user, allergens: e.target.value.split(',').map(s => s.trim())})} 
                className="input-field" 
                placeholder="Peanuts, Shellfish, Gluten..."
            />
         </div>

         <Button fullWidth onClick={() => { saveUser(user); setScreen('WELCOME'); }} className="mt-4 py-5 text-lg shadow-lg">Save Changes</Button>
       </div>
     </div>
  );

  return (
    <Layout activeScreen={screen} onNavigate={setScreen}>
      {loading && <LoadingOverlay />}
      {viewingRecipe && <RecipeModal meal={viewingRecipe} onClose={() => setViewingRecipe(null)} />}
      <div className={`${user.theme === AppTheme.LIGHT ? 'text-slate-800' : ''}`}>
        {screen === 'WELCOME' && renderWelcome()}
        {screen === 'MEAL_PLAN' && renderMealPlan()}
        {screen === 'GROCERY_LIST' && renderGroceryList()}
        {screen === 'NUTRITION_REPORT' && renderNutritionReport()}
        {screen === 'PROGRESS_TRACKER' && renderProgressTracker()}
        {screen === 'FAVORITES' && renderFavorites()}
        {screen === 'SETTINGS' && renderSettings()}
      </div>
      
      {/* Global Style Overrides for Inputs based on Theme */}
      <style>{`
        .input-field {
            width: 100%;
            padding: 1.25rem;
            border-radius: 1.5rem;
            background-color: ${user.theme === AppTheme.LIGHT ? '#F1F5F9' : '#1E293B'};
            border: 2px solid transparent;
            font-weight: 700;
            color: ${user.theme === AppTheme.LIGHT ? '#0F172A' : '#FFFFFF'};
            transition: all 0.2s;
            outline: none;
        }
        .input-field:focus {
             background-color: ${user.theme === AppTheme.LIGHT ? '#FFFFFF' : '#1E293B'};
             border-color: #8B5CF6;
        }
        .label-text {
            display: block;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${user.theme === AppTheme.LIGHT ? '#64748B' : '#94A3B8'};
            margin-bottom: 0.5rem;
            margin-left: 1rem;
        }
        .header-title {
            font-size: 2.25rem;
            font-weight: 800;
            color: ${user.theme === AppTheme.LIGHT ? '#0F172A' : '#FFFFFF'};
            letter-spacing: -0.025em;
            margin-bottom: 0.5rem;
        }
        .sub-header {
            color: ${user.theme === AppTheme.LIGHT ? '#64748B' : '#94A3B8'};
            font-weight: 500;
        }
        .btn-secondary {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background-color: ${user.theme === AppTheme.LIGHT ? '#FFFFFF' : '#1E293B'};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border: 1px solid ${user.theme === AppTheme.LIGHT ? '#E2E8F0' : '#334155'};
            border-radius: 1rem;
            color: ${user.theme === AppTheme.LIGHT ? '#64748B' : '#94A3B8'};
            font-weight: 700;
            transition: all 0.2s;
        }
        .btn-secondary:hover {
            color: #8B5CF6;
            border-color: rgba(139, 92, 246, 0.5);
        }
        .back-btn {
            padding: 0.75rem;
            margin-left: -0.75rem;
            border-radius: 9999px;
            color: ${user.theme === AppTheme.LIGHT ? '#64748B' : '#94A3B8'};
            transition: all 0.2s;
        }
        .back-btn:hover {
            background-color: ${user.theme === AppTheme.LIGHT ? '#F1F5F9' : '#1E293B'};
            color: ${user.theme === AppTheme.LIGHT ? '#0F172A' : '#FFFFFF'};
        }
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-top: 5rem;
            color: ${user.theme === AppTheme.LIGHT ? '#94A3B8' : '#64748B'};
        }
      `}</style>
    </Layout>
  );
}
