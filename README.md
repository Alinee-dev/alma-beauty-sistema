# Catálogo público conectado al inventario

La página principal (`/`) muestra el catálogo público. El panel de administración está en `/admin/` y requiere iniciar sesión. El catálogo consulta los productos y la configuración de la tienda desde el mismo proyecto de Supabase; muestra solo productos con stock y no publica el costo ni la cantidad exacta disponible.

## Puesta en marcha

1. En el proyecto de Supabase usado por el panel, ejecuta `supabase_public_catalog.sql` desde **SQL Editor**. Si ya la ejecutaste antes, vuelve a ejecutarla para actualizar el stock y los precios de oferta expuestos al catálogo.
2. Usa las mismas variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` del panel para el catálogo. Nunca uses ni publiques una clave `service_role`.
3. Para publicar el catálogo por separado, ejecuta `npm run build:catalog` y despliega el contenido de `dist-catalog`. Para publicar catálogo y panel juntos, ejecuta `npm run build`; el catálogo estará en `/` y el panel en `/admin/`.
4. Los cambios de stock se reflejan al abrir o volver a la página y se actualizan automáticamente cada 30 segundos. El catálogo no muestra la cantidad exacta, pero esa cifra queda disponible para el navegador para limitar el carrito. Los pedidos por WhatsApp no reservan ni descuentan stock: registra la venta en el panel para actualizar el inventario.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
