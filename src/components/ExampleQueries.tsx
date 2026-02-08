interface Example {
  title: string;
  description: string;
  query: string;
  category: string;
}

interface ExampleQueriesProps {
  onExampleClick: (query: string) => void;
  currentQuery: string;
}

const EXAMPLES: Example[] = [
  {
    category: 'Basic Selection',
    title: 'First 10 Cars',
    description: 'Get the first 10 items from the array',
    query: '$[0:10]',
  },
  {
    category: 'Basic Selection',
    title: 'Last 5 Cars',
    description: 'Get the last 5 items',
    query: '$[-5:]',
  },
  {
    category: 'Basic Selection',
    title: 'Every 1000th Car',
    description: 'Get every 1000th item',
    query: '$[0::1000]',
  },
  {
    category: 'Property Access',
    title: 'All Car Models',
    description: 'Extract the "model" property from all cars',
    query: '$[*].model',
  },
  {
    category: 'Property Access',
    title: 'All Brand Names',
    description: 'Extract brand names from all cars',
    query: '$[*].brand.name',
  },
  {
    category: 'Filtering',
    title: 'Suzuki Cars',
    description: 'Find all Suzuki vehicles',
    query: '$[?(@.brand.name == "Suzuki")]',
  },
  {
    category: 'Filtering',
    title: 'Toyota Cars',
    description: 'Find all Toyota vehicles',
    query: '$[?(@.brand.name == "Toyota")]',
  },
  {
    category: 'Filtering',
    title: 'Honda Cars',
    description: 'Find all Honda vehicles',
    query: '$[?(@.brand.name == "Honda")]',
  },
  {
    category: 'Filtering',
    title: 'Mehran Model',
    description: 'Find all Mehran models',
    query: '$[?(@.model == "Mehran")]',
  },
  {
    category: 'Filtering',
    title: 'Used Cars Only',
    description: 'Find cars with used condition',
    query: '$[?(@.itemCondition == "used")]',
  },
  {
    category: 'Advanced',
    title: 'Multiple Brands',
    description: 'Find Suzuki, Toyota, or Honda cars',
    query: '$[?(@.brand.name == "Suzuki" || @.brand.name == "Toyota" || @.brand.name == "Honda")]',
  },
  {
    category: 'Advanced',
    title: 'Cars with Descriptions',
    description: 'Find cars that have descriptions',
    query: '$[?(@.description)]',
  },
  {
    category: 'Advanced',
    title: 'Car Types',
    description: 'Get all @type values',
    query: '$[*]["@type"]',
  },
  {
    category: 'Performance',
    title: 'Count All Items',
    description: 'Return all items (performance test)',
    query: '$[*]',
  },
  {
    category: 'Performance',
    title: 'Random Sample',
    description: 'Get items at specific indices',
    query: '$[100,500,1000,5000,10000]',
  },
];

const ExampleQueries = ({ onExampleClick, currentQuery }: ExampleQueriesProps) => {
  const categories = Array.from(new Set(EXAMPLES.map((ex) => ex.category)));

  return (
    <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-700 p-6 shadow-xl transition-colors duration-300">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center transition-colors duration-300">
        <span className="mr-2">📚</span>
        Example Queries
      </h2>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide transition-colors duration-300">
              {category}
            </h3>
            <div className="space-y-2">
              {EXAMPLES.filter((ex) => ex.category === category).map((example, idx) => {
                const isActive = currentQuery === example.query;
                return (
                  <button
                    key={idx}
                    onClick={() => onExampleClick(example.query)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 border-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600'
                    } border`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-900 dark:text-white'} transition-colors duration-300`}>{example.title}</div>
                      {isActive && (
                        <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full text-white">Active</span>
                      )}
                    </div>
                    <div className={`text-xs mb-2 ${isActive ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'} transition-colors duration-300`}>{example.description}</div>
                    <code className={`text-xs font-mono px-2 py-1 rounded block overflow-x-auto ${isActive ? 'text-blue-100 bg-blue-700/50' : 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-gray-900/50'} transition-colors duration-300`}>
                      {example.query}
                    </code>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-300">🎯 Pro Tips:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Start with simple queries and build complexity</li>
            <li>Use filters with <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded transition-colors duration-300">?(@.prop)</code></li>
            <li>Combine conditions with <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded transition-colors duration-300">&&</code> and <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded transition-colors duration-300">||</code></li>
            <li>Test performance with different dataset sizes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExampleQueries;
