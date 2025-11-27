import { useRecipe } from '../hooks/useRecipe';

export default function ItemDetail({ item, onClose }) {
    const { recipe, loading } = useRecipe(item?.id);

    if (!item) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <div className="w-20 h-20 bg-gray-900 rounded-lg flex items-center justify-center p-2">
                            <img src={item.img_url} alt={item.name} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-100">{item.name}</h2>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                                <span className="text-blue-400">Niveau {item.level}</span>
                                <span className="text-gray-400">{item.type}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Description */}
                    {item.description && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-2">Description</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                        </div>
                    )}

                    {/* Recette */}
                    {loading ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                        </div>
                    ) : recipe ? (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">Recette de craft</h3>
                            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                <div className="flex items-center mb-4">
                                    <span className="text-purple-400 font-medium">{recipe.job_name}</span>
                                </div>

                                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-300">Ingrédients requis :</h4>
                                        {recipe.ingredients.map((ingredient) => (
                                            <div key={ingredient.id} className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
                                                <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center p-1">
                                                    <img src={ingredient.img_url} alt={ingredient.name} className="max-w-full max-h-full object-contain" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-200 font-medium">{ingredient.name}</p>
                                                    <p className="text-xs text-gray-400">Niveau {ingredient.level}</p>
                                                </div>
                                                <span className="text-blue-400 font-semibold">x{ingredient.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">Aucun ingrédient disponible</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <p className="text-gray-500 text-sm">Cet item n'a pas de recette de craft</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
