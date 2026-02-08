# JSONPathX React Demo 🚀

An interactive demo application showcasing the **JSONPathX** library with React, TypeScript, and Vite. This demo uses a large dataset (109 MB cars.json) to demonstrate the performance and capabilities of JSONPathX.

## Features ✨

- **Interactive Query Editor**: Write and test JSONPath queries in real-time
- **Large Dataset Support**: Efficiently handles the 109 MB cars.json dataset
- **Performance Metrics**: See execution time for each query
- **Example Queries**: Pre-built examples for common use cases
- **Result Visualization**: Pretty-print and compact view modes
- **Export Functionality**: Copy to clipboard or download results as JSON
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Clear error messages for invalid queries
- **Type Safety**: Full TypeScript support

## Tech Stack 🧰

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **JSONPathX**: High-performance JSONPath query engine

## Getting Started 🚦

### Prerequisites ✅

- Node.js 16+ and npm/yarn/pnpm

### Installation 📦

1. Install dependencies:

```bash
npm install
```

2. Install the JSONPathX package (included in dependencies):

```bash
npm install
```

### Development 🧪

Start the development server:

```bash
npm run dev
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Build 🏗️

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage 🧭

### Query Editor ✍️

The query editor accepts standard JSONPath expressions. Type your query and see results in real-time.

### Example Queries 🧩

Click on any example query to load it into the editor:

- **Basic Selection**: Array slicing, indexing
- **Property Access**: Extract specific fields
- **Filtering**: Find items matching criteria
- **Advanced**: Complex queries with multiple conditions
- **Performance**: Test with large result sets

### Result Display 📊

- Toggle between pretty and compact JSON views
- Copy results to clipboard
- Download results as JSON file
- Adjust display limit for large result sets
- View execution time and result statistics

## JSONPath Syntax Examples 🧪

```javascript
// Get first 10 items
$[0:10]

// Get all "Make" properties
$[*].Make

// Filter by condition
$[?(@.Year >= 2020)]

// Complex filter
$[?(@.Make == "Tesla" && @["Electric Range"] > 300)]

// Multiple conditions
$[?(@.Make == "BMW" || @.Make == "Audi")]
```

## Dataset 🗂️

The demo uses `cars.json` (109 MB), which contains information about alternative fuel vehicles. The dataset includes:

- Vehicle make and model
- Year
- Alternative fuel type (Electric, Hybrid, etc.)
- Electric range
- MPG ratings
- And more...

## Project Structure 🧱

```
jsonpathx-react-usage/
├── public/
├── src/
│   ├── components/
│   │   ├── QueryEditor.tsx      # JSONPath query input
│   │   ├── ResultsDisplay.tsx   # Results visualization
│   │   └── ExampleQueries.tsx   # Example query list
│   ├── hooks/
│   │   └── useJsonPath.ts       # Custom hook for JSONPath queries
│   ├── styles/
│   │   └── App.css              # Global styles
│   ├── App.tsx                  # Main application
│   └── main.tsx                 # Entry point
├── cars.json                    # Large dataset (109 MB)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Performance Tips ⚡

1. **Limit Results**: Use the display limit dropdown for queries returning many results
2. **Specific Queries**: More specific queries are faster than broad ones
3. **Array Slicing**: Use array slicing `[0:100]` for sampling large datasets
4. **Filter Early**: Apply filters to reduce the result set size

## Troubleshooting 🛠️

### Cars.json not found

Make sure `cars.json` is in the project root directory. The file should be 109 MB in size.

### JSONPathX not working

Reinstall dependencies to ensure the npm package is present:

```bash
npm install
```

### Slow queries

For very large result sets:

- Use array slicing to limit results
- Increase the timeout in the useJsonPath hook
- Use more specific filters

## Contributing 🤝

This is a demo project for JSONPathX. For issues or contributions to the JSONPathX library itself, please visit the main repository.

## License 📄

This demo project follows the same license as JSONPathX.

## Learn More 🔎

- [JSONPathX Documentation](https://jsonpathx.github.io/jsonpathx/)
- [JSONPath Specification](https://goessner.net/articles/JsonPath/)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)

---

Built with ❤️ using JSONPathX 🎯
