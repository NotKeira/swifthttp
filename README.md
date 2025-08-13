# SwiftHTTP

A lightweight, high-performance HTTP server for Node.js. Built for speed and simplicity without sacrificing advanced features. TypeScript-first with zero dependencies.

## Features

- ⚡ **Blazing Fast** - Optimised for performance
- 🪶 **Lightweight** - Zero dependencies, minimal footprint
- 🔒 **Type Safe** - Built with TypeScript, full type definitions
- 🎯 **Simple API** - Intuitive and developer-friendly
- 🔧 **Extensible** - Middleware support for customisation
- 📦 **Modern** - ES2020+ features, async/await support

## Installation

```bash
pnpm add swifthttp
# or
npm install swifthttp
# or
yarn add swifthttp
```

## Quick Start

```typescript
import { HTTP } from 'swifthttp';

const app = new HTTP();

app.get('/', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## API Documentation

Coming soon...

## Contributing

Contributions are welcome! Please read our contributing guidelines and code of conduct.

## License

MIT © Keira Hopkins