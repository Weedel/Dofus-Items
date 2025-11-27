import { useRef, useEffect, useCallback } from 'react';
import ItemCard from './ItemCard';

export default function ItemGrid({ items, onItemClick, loading, hasMore, onLoadMore }) {
    const observer = useRef();
    const lastItemElementRef = useCallback(node => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                onLoadMore();
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, onLoadMore]);

    if (loading && items.length === 0) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 animate-pulse">
                        <div className="aspect-square bg-gray-700"></div>
                        <div className="p-4 space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0 && !loading) {
        return (
            <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-300">Aucun item trouvé</h3>
                <p className="mt-1 text-sm text-gray-500">Essayez de modifier vos filtres ou votre recherche.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {items.map((item, index) => {
                    if (items.length === index + 1) {
                        return (
                            <div ref={lastItemElementRef} key={item.id}>
                                <ItemCard
                                    item={item}
                                    onClick={() => onItemClick(item)}
                                />
                            </div>
                        );
                    } else {
                        return (
                            <ItemCard
                                key={item.id}
                                item={item}
                                onClick={() => onItemClick(item)}
                            />
                        );
                    }
                })}
            </div>

            {loading && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    );
}
