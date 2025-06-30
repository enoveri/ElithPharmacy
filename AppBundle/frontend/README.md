# Elith Pharmacy - Frontend

The frontend application for Elith Pharmacy management system, built with React, Vite, and Tailwind CSS.

## 🚀 Tech Stack

- **React 19.1.0** - Modern UI library with latest features
- **Vite 6.3.5** - Fast build tool and development server
- **Tailwind CSS 4.1.8** - Utility-first CSS framework
- **React Router DOM 6.22.3** - Client-side routing
- **Zustand 4.5.2** - Lightweight state management
- **Supabase JS 2.43.2** - Backend-as-a-Service integration
- **Dexie 4.0.5** - IndexedDB wrapper for offline storage
- **HTML2PDF.js** - PDF generation for receipts
- **ESLint & Prettier** - Code quality and formatting

## 🛠️ Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open your browser and visit `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## 🎨 Styling

This project uses **Tailwind CSS 4.1.8** for styling with:

- Utility-first approach
- Responsive design patterns
- Modern CSS features
- Custom design system for pharmacy theme

## 📁 Project Structure

```
src/
├── assets/              # Static assets (images, icons, fonts)
├── components/          # Global reusable UI components
│   └── ui/              # Tailwind-based UI primitives
├── features/            # Domain-driven feature modules
│   ├── auth/            # Authentication & session management
│   ├── products/        # Product management & inventory
│   ├── sales/           # Sales processing & transactions
│   ├── reports/         # Analytics and reporting
│   └── users/           # User and staff management
├── layout/              # Layout components (AppShell, Navbar, Sidebar)
├── pages/               # Route-level page components
├── routes/              # React Router configuration
├── lib/                 # Shared utilities and configurations
│   ├── supabase/        # Supabase client & database methods
│   ├── db/              # Dexie.js offline storage setup
│   ├── utils/           # Utility functions & formatters
│   ├── validators/      # Form validation schemas
│   └── config.js        # Environment-based app settings
├── services/            # Business logic & API service functions
├── store/               # Zustand state management slices
├── hooks/               # Custom React hooks
├── App.jsx              # Root application component
└── main.jsx             # Vite entry point
```

## 🔧 Configuration

### Vite Configuration

- React plugin for JSX support
- Tailwind CSS integration
- Development server optimization

### ESLint Configuration

- React-specific rules
- Modern JavaScript standards
- Code quality enforcement

## 🚧 Development Notes

This frontend is built with a modern, scalable architecture:

- ✅ **Complete project structure** with domain-driven organization
- ✅ **Modern React 19** with latest features and patterns
- ✅ **Tailwind CSS 4** integration for styling
- ✅ **State management** with Zustand for predictable state updates
- ✅ **Offline capabilities** with Dexie.js for local storage
- ✅ **Database integration** ready with Supabase client
- ✅ **Development tooling** with ESLint and Prettier
- 🚧 **Feature implementation** - Ready for component development
- 🚧 **API integration** - Pending backend implementation

### Architecture Benefits

- **Domain-driven design** - Features organized by business domain
- **Separation of concerns** - Clear boundaries between UI, logic, and data
- **Offline-first** - Works without internet connection
- **Type safety** - Validation schemas for data integrity
- **Developer experience** - Hot reload, linting, and formatting

## 🤝 Contributing

When contributing to the frontend:

1. Follow the established ESLint rules
2. Use Tailwind CSS for styling
3. Maintain component-based architecture
4. Write clean, readable React code
5. Test your changes locally

For more information, see the main project README in the root directory.
