import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const ITEMS_PER_PAGE = 20;

export function useItems(searchTerm = '', filters = {}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Reset pagination when search or filters change
    useEffect(() => {
        setItems([]);
        setPage(0);
        setHasMore(true);
        setLoading(true);
        fetchItems(0, true);
    }, [searchTerm, filters]);

    const fetchItems = async (pageToFetch, isNewSearch = false) => {
        try {
            if (!isNewSearch) setLoading(true);

            let query = supabase
                .from('items')
                .select('*', { count: 'exact' })
                .order('level', { ascending: true })
                .range(pageToFetch * ITEMS_PER_PAGE, (pageToFetch + 1) * ITEMS_PER_PAGE - 1);

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

            const { data, error, count } = await query;

            if (error) throw error;

            if (isNewSearch) {
                setItems(data || []);
            } else {
                setItems(prev => [...prev, ...(data || [])]);
            }

            // Check if we have more items to load
            const currentCount = (pageToFetch + 1) * ITEMS_PER_PAGE;
            setHasMore(currentCount < count);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchItems(nextPage, false);
        }
    }, [loading, hasMore, page, searchTerm, filters]);

    return { items, loading, error, hasMore, loadMore };
}
