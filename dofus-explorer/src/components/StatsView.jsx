import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import RecipeTooltip from './RecipeTooltip';

const ITEMS_PER_PAGE = 50;

export default function StatsView({ onItemClick }) {
    const [allSortedIds, setAllSortedIds] = useState([]);
    const [itemStats, setItemStats] = useState({});
    const [displayedItems, setDisplayedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [hoveredItem, setHoveredItem] = useState(null);

    const observer = useRef();
    const lastItemElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreItems();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    useEffect(() => {
        fetchAllStats();
    }, []);

    async function fetchAllStats() {
        try {
            setLoading(true);

            // 1. Fetch ALL recipe ingredients with quantity AND recipe_id
            let allIngredients = [];
            let fetchPage = 0;
            const fetchSize = 1000;

            while (true) {
                const { data, error: ingError } = await supabase
                    .from('recipe_ingredients')
                    .select('item_id, quantity, recipe_id')
                    .range(fetchPage * fetchSize, (fetchPage + 1) * fetchSize - 1);

                if (ingError) throw ingError;

                allIngredients = [...allIngredients, ...data];
                if (data.length < fetchSize) break;
                fetchPage++;
            }

            // 2. Aggregate stats (quantity, recipe count, and recipe IDs)
            const stats = {};
            allIngredients.forEach(row => {
                if (!stats[row.item_id]) {
                    stats[row.item_id] = { quantity: 0, recipes: 0, tensionScore: 0, recipeIds: [] };
                }
                stats[row.item_id].quantity += (row.quantity || 0);
                stats[row.item_id].recipes += 1;
                stats[row.item_id].recipeIds.push(row.recipe_id);
            });

            // Calculate score for each item
            Object.keys(stats).forEach(id => {
                const item = stats[id];
                item.tensionScore = item.quantity * item.recipes;
            });

            setItemStats(stats);

            // 3. Sort all IDs by Tension Score
            const sortedIds = Object.entries(stats)
                .sort(([, a], [, b]) => b.tensionScore - a.tensionScore)
                .map(([id]) => parseInt(id));

            setAllSortedIds(sortedIds);

            // 4. Fetch first page of items
            await initialFetchDetails(sortedIds, stats);

        } catch (err) {
            console.error(err);
            setError("Impossible de charger les statistiques.");
        } finally {
            setLoading(false);
        }
    }

    const loadMoreItems = async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);

        const nextPage = page + 1;
        const start = nextPage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const idsToFetch = allSortedIds.slice(start, end);

        if (idsToFetch.length === 0) {
            setHasMore(false);
            setLoadingMore(false);
            return;
        }

        try {
            const { data: items, error } = await supabase
                .from('items')
                .select('*')
                .in('id', idsToFetch);

            if (error) throw error;

            const newItems = idsToFetch
                .map(id => items.find(item => item.id === id))
                .filter(item => item)
                .map(item => ({
                    ...item,
                    stats: itemStats[item.id]
                }));

            setDisplayedItems(prev => [...prev, ...newItems]);
            setPage(nextPage);
            if (end >= allSortedIds.length) setHasMore(false);

        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMore(false);
        }
    };

    const initialFetchDetails = async (ids, stats) => {
        const idsToFetch = ids.slice(0, ITEMS_PER_PAGE);
        const { data: items, error } = await supabase
            .from('items')
            .select('*')
            .in('id', idsToFetch);

        if (error) throw error;

        const newItems = idsToFetch
            .map(id => items.find(item => item.id === id))
            .filter(item => item)
            .map(item => ({
                ...item,
                stats: stats[item.id]
            }));

        setDisplayedItems(newItems);
        setPage(0);
        if (ids.length <= ITEMS_PER_PAGE) setHasMore(false);
        else setHasMore(true);
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 text-red-400 backdrop-blur-sm text-center">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                    Ressources sous tension ({allSortedIds.length})
                    <span className="block text-sm font-normal text-gray-400 mt-1">
                        Classé par score de tension (Quantité × Recettes)
                    </span>
                </h2>
            </div>

            {/* List Header */}
            <div className="grid grid-cols-12 gap-6 px-6 py-4 text-base font-bold text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6">Ressource</div>
                <div className="col-span-2 text-right">Score</div>
                <div className="col-span-3 text-right">Détails</div>
            </div>

            <div className="space-y-3">
                {displayedItems.map((item, index) => {
                    const isLast = index === displayedItems.length - 1;
                    return (
                        <div
                            key={item.id}
                            className="relative group"
                            ref={isLast ? lastItemElementRef : null}
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <div
                                onClick={() => onItemClick(item)}
                                className="grid grid-cols-12 gap-6 items-center px-6 py-4 bg-gray-800/20 hover:bg-gray-700/40 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-gray-700"
                            >
                                {/* Rank */}
                                <div className="col-span-1 flex justify-center">
                                    <span className={`text-xl font-bold ${index < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                        {index + 1}
                                    </span>
                                </div>

                                {/* Resource Info */}
                                <div className="col-span-6 flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gray-900 rounded-xl p-2 flex-shrink-0 border border-gray-800">
                                        <img src={item.img_url} alt={item.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-lg font-medium text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                                            {item.name}
                                        </p>
                                        <p className="text-base text-gray-500">Niv. {item.level}</p>
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="col-span-2 text-right">
                                    <span className="text-lg font-bold text-orange-500/90">
                                        {item.stats?.tensionScore.toLocaleString()}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="col-span-3 text-right flex flex-col justify-center gap-1">
                                    <span className="text-base text-blue-400/90">
                                        {item.stats?.quantity.toLocaleString()} <span className="text-gray-600">qté</span>
                                    </span>
                                    <span className="text-base text-purple-400/90">
                                        {item.stats?.recipes} <span className="text-gray-600">recettes</span>
                                    </span>
                                </div>
                            </div>

                            {/* Render Tooltip on Hover */}
                            {hoveredItem === item.id && (
                                <RecipeTooltip recipeIds={item.stats?.recipeIds} />
                            )}
                        </div>
                    );
                })}
            </div>

            {loadingMore && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}
            {!hasMore && displayedItems.length > 0 && (
                <div className="text-center text-gray-500 py-4">
                    Toutes les ressources ont été chargées.
                </div>
            )}
        </div>
    );
}
