export default function ItemCard({ item, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-xl"
        >
            <div className="aspect-square bg-gray-900 flex items-center justify-center p-4">
                <img
                    src={item.img_url}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-100 mb-1 truncate">
                    {item.name}
                </h3>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-400">Niv. {item.level}</span>
                    <span className="text-gray-400">{item.type}</span>
                </div>
            </div>
        </div>
    );
}
