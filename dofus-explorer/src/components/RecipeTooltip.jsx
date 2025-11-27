import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RecipeTooltip({ recipeIds }) {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function fetchRecipes() {
            if (!recipeIds || recipeIds.length === 0) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Fetch more items for the grid view (e.g., 12)
                const idsToFetch = recipeIds.slice(0, 12);

                const { data: recipeData, error: recipeError } = await supabase
                    .from('recipes')
                    .select('id, item_id')
                    .in('id', idsToFetch);

                if (recipeError) throw recipeError;

                if (!recipeData || recipeData.length === 0) {
                    if (isMounted) setRecipes([]);
                    return;
                }

                const itemIds = recipeData.map(r => r.item_id);
                const { data: itemData, error: itemError } = await supabase
                    .from('items')
                    .select('id, name, img_url, level')
                    .in('id', itemIds);

                if (itemError) throw itemError;

                if (isMounted) {
                    setRecipes(itemData || []);
                }

            } catch (err) {
                console.error("Tooltip Error:", err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchRecipes();

        return () => {
            isMounted = false;
        };
    }, [recipeIds]);

    // Fixed position container styles
    const containerClasses = "fixed bottom-8 right-8 z-50 w-[450px] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4";

    if (loading) {
        return (
            <div className={containerClasses}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-4 bg-gray-800 rounded w-1/3 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-lg animate-pulse">
                            <div className="w-10 h-10 bg-gray-800 rounded"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-gray-800 rounded w-3/4"></div>
                                <div className="h-2 bg-gray-800 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) return null;
    if (recipes.length === 0) return null;

    return (
        <div className={containerClasses}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-700/50 pb-3">
                <h4 className="text-sm font-bold text-gray-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Utilisé dans {recipeIds.length} recettes
                </h4>
                {recipeIds.length > 12 && (
                    <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                        +{recipeIds.length - 12} autres
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                {recipes.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-gray-800/50 hover:bg-gray-800 p-2 rounded-lg border border-gray-700/30 transition-colors group">
                        <div className="w-10 h-10 bg-gray-900 rounded-md p-1 flex-shrink-0 border border-gray-700/50 group-hover:border-gray-600">
                            <img src={item.img_url} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                                {item.name}
                            </p>
                            <p className="text-[10px] font-medium text-blue-400/80">
                                Niv. {item.level}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
