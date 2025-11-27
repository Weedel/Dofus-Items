import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRecipe(itemId) {
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (itemId) {
            fetchRecipe();
        }
    }, [itemId]);

    async function fetchRecipe() {
        try {
            setLoading(true);

            // Récupérer la recette avec les ingrédients
            const { data, error } = await supabase
                .from('recipes')
                .select(`
          id,
          item_id,
          job_id,
          job_name,
          recipe_ingredients (
            quantity,
            item_id
          )
        `)
                .eq('item_id', itemId)
                .single();

            if (error) throw error;

            // Si on a une recette, récupérer les détails des ingrédients
            if (data && data.recipe_ingredients) {
                const ingredientIds = data.recipe_ingredients.map(ri => ri.item_id);

                const { data: ingredientsData, error: ingredientsError } = await supabase
                    .from('items')
                    .select('*')
                    .in('id', ingredientIds);

                if (ingredientsError) throw ingredientsError;

                // Mapper les ingrédients avec leurs quantités
                data.ingredients = data.recipe_ingredients.map(ri => {
                    const ingredient = ingredientsData.find(i => i.id === ri.item_id);
                    return {
                        ...ingredient,
                        quantity: ri.quantity
                    };
                });
            }

            setRecipe(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return { recipe, loading, error, refetch: fetchRecipe };
}
