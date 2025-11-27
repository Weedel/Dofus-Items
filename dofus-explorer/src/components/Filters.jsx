import { useState, useEffect } from 'react';

export default function Filters({ filters, onChange }) {
    const [types, setTypes] = useState([]);
    const [minLevel, setMinLevel] = useState(filters.minLevel || 1);
    const [maxLevel, setMaxLevel] = useState(filters.maxLevel || 200);

    // Simuler la récupération des types uniques (à améliorer avec une vraie requête)
    useEffect(() => {
        setTypes(['all', 'Épée', 'Dague', 'Arc', 'Bâton', 'Marteau', 'Amulette', 'Anneau', 'Bottes', 'Ceinture']);
    }, []);

    const handleTypeChange = (type) => {
        onChange({ ...filters, type });
    };

    const handleLevelChange = () => {
        onChange({ ...filters, minLevel, maxLevel });
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Filtres</h3>

            {/* Filtre par type */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Type d'item</label>
                <select
                    value={filters.type || 'all'}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {types.map(type => (
                        <option key={type} value={type}>
                            {type === 'all' ? 'Tous les types' : type}
                        </option>
                    ))}
                </select>
            </div>

            {/* Filtre par niveau */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    Niveau ({minLevel} - {maxLevel})
                </label>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Min</label>
                        <input
                            type="range"
                            min="1"
                            max="200"
                            value={minLevel}
                            onChange={(e) => setMinLevel(Number(e.target.value))}
                            onMouseUp={handleLevelChange}
                            onTouchEnd={handleLevelChange}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Max</label>
                        <input
                            type="range"
                            min="1"
                            max="200"
                            value={maxLevel}
                            onChange={(e) => setMaxLevel(Number(e.target.value))}
                            onMouseUp={handleLevelChange}
                            onTouchEnd={handleLevelChange}
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
