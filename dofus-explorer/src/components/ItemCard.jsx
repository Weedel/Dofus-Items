export default function ItemCard({ item, onClick }) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative aspect-square bg-gray-900/50 flex items-center justify-center p-4 group-hover:scale-105 transition-transform duration-300">
                <img
                    src={item.img_url}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain drop-shadow-lg"
                    loading="lazy"
                />
            </div>

            <div className="relative p-3 border-t border-gray-700/50">
                <h3 className="text-sm font-bold text-gray-100 mb-2 truncate group-hover:text-blue-400 transition-colors">
                    {item.name}
                </h3>
                <div className="flex items-center justify-between text-xs font-medium">
                    <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Niv. {item.level}
                    </span>
                    <span className="text-gray-400 group-hover:text-gray-300 transition-colors truncate max-w-[50%] text-right">
                        {item.type}
                    </span>
                </div>
            </div>
        </div>
    );
}
