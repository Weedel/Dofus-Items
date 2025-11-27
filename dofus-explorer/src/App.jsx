import { useState } from 'react';
import SearchBar from './components/SearchBar';
import Filters from './components/Filters';
import ItemGrid from './components/ItemGrid';
import ItemDetail from './components/ItemDetail';
import { useItems } from './hooks/useItems';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    minLevel: 1,
    maxLevel: 200
  });
  const [selectedItem, setSelectedItem] = useState(null);

  const { items, loading, error } = useItems(searchTerm, filters);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
            DofusDB Explorer
          </h1>
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <div className="sticky top-32">
              <Filters filters={filters} onChange={setFilters} />
            </div>
          </aside>

          {/* Items Grid */}
          <div className="lg:col-span-3">
            {error ? (
              <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4 text-red-400">
                <p className="font-semibold">Erreur</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : (
              <ItemGrid
                items={items}
                loading={loading}
                onItemClick={setSelectedItem}
              />
            )}
          </div>
        </div>
      </main>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default App;
