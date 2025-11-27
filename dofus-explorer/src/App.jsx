import { useState } from 'react';
import SearchBar from './components/SearchBar';
import Filters from './components/Filters';
import ItemGrid from './components/ItemGrid';
import ItemDetail from './components/ItemDetail';
import StatsView from './components/StatsView';
import { useItems } from './hooks/useItems';

function App() {
  const [currentView, setCurrentView] = useState('explorer'); // 'explorer' | 'stats'
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    minLevel: 1,
    maxLevel: 200
  });
  const [selectedItem, setSelectedItem] = useState(null);

  const { items, loading, error, hasMore, loadMore } = useItems(searchTerm, filters);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-40 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
              DofusDB Explorer
            </h1>
            {currentView === 'explorer' && (
              <div className="w-full md:w-auto md:min-w-[400px]">
                <SearchBar value={searchTerm} onChange={setSearchTerm} />
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-4 border-b border-gray-700/50">
            <button
              onClick={() => setCurrentView('explorer')}
              className={`pb-2 px-4 text-sm font-medium transition-colors relative ${currentView === 'explorer'
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              Explorateur
              {currentView === 'explorer' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`pb-2 px-4 text-sm font-medium transition-colors relative ${currentView === 'stats'
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
                }`}
            >
              Statistiques
              {currentView === 'stats' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400 rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'explorer' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Filters */}
            <aside className="lg:col-span-1">
              <div className="sticky top-36 space-y-6">
                <Filters filters={filters} onChange={setFilters} />
              </div>
            </aside>

            {/* Items Grid */}
            <div className="lg:col-span-3">
              {error ? (
                <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 text-red-400 backdrop-blur-sm">
                  <p className="font-bold text-lg mb-2">Erreur</p>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              ) : (
                <ItemGrid
                  items={items}
                  loading={loading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  onItemClick={setSelectedItem}
                />
              )}
            </div>
          </div>
        ) : (
          <StatsView onItemClick={setSelectedItem} />
        )}
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default App;
