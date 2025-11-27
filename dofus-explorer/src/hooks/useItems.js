import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useItems(searchTerm = '', filters = {}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchItems();
    }, [searchTerm, filters]);

    async function fetchItems() {
        try {
            setLoading(true);
            let query = supabase
                .from('items')
                .select('*')
                .order('level', { ascending: true });

            // Recherche par nom
            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            // Filtre par type
            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }

            // Filtre par niveau
            if (filters.minLevel) {
                query = query.gte('level', filters.minLevel);
            }
            if (filters.maxLevel) {
                query = query.lte('level', filters.maxLevel);
            }

            const { data, error } = await query;

            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return { items, loading, error, refetch: fetchItems };
}
