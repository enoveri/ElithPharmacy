# Elith Pharmacy

A modern pharmacy management system built with React and Python, designed to streamline pharmacy operations and improve customer service.

## 🏗️ Project Structure

```
Elith Pharmacy/
├── frontend/                    # React frontend application
│   ├── public/                  # Static files (favicon, logo, robots.txt)
│   │   └── manifest.json        # PWA manifest
│   ├── src/
│   │   ├── assets/              # Images, fonts, icons
│   │   ├── components/          # Global reusable UI components
│   │   │   └── ui/              # Tailwind-based UI primitives
│   │   ├── features/            # Domain-driven feature modules
│   │   │   ├── auth/            # Authentication & session management
│   │   │   ├── products/        # Product management & inventory
│   │   │   ├── sales/           # Sales processing & transactions
│   │   │   ├── reports/         # Analytics and reporting
│   │   │   └── users/           # User and staff management
│   │   ├── layout/              # AppShell, Navbar, Sidebar components
│   │   ├── pages/               # Route-level page components
│   │   ├── routes/              # React Router configuration
│   │   ├── lib/                 # Shared utilities and configurations
│   │   │   ├── supabase/        # Supabase client & database methods
│   │   │   ├── db/              # Dexie.js offline storage
│   │   │   ├── utils/           # Utility functions & formatters
│   │   │   ├── validators/      # Form validation schemas
│   │   │   └── config.js        # Environment-based app settings
│   │   ├── services/            # Business logic & API wrappers
│   │   ├── store/               # Zustand state management
│   │   ├── hooks/               # Custom React hooks
│   │   ├── App.jsx              # Root application component
│   │   └── main.jsx             # Vite entry point
│   ├── .env                     # Environment variables
│   ├── package.json             # Dependencies and scripts
│   ├── vite.config.js           # Vite configuration
│   └── eslint.config.js         # ESLint configuration
├── backend/                     # Python backend API
│   └── requirements.txt         # Python dependencies
└── README.md                    # Project documentation
```

## 🚀 Tech Stack

### Frontend
- **React 19.1.0** - Modern UI library
- **Vite 6.3.5** - Fast build tool and development server
- **Tailwind CSS 4.1.8** - Utility-first CSS framework
- **ESLint** - Code linting and formatting



## ✨ Features

This pharmacy management system will include:

- 💊 **Inventory Management** - Track medication stock levels
- 🧾 **Prescription Processing** - Handle customer prescriptions
- 👥 **Customer Management** - Maintain customer records
- 📊 **Sales Analytics** - Monitor pharmacy performance
- 🔐 **User Authentication** - Secure access control
- 📱 **Responsive Design** - Works on all devices

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or yarn

### Frontend Setup

1. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Create a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install dependencies (once requirements.txt is populated):
   ```powershell
   pip install -r requirements.txt
   ```

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🎨 Design System

The project uses Tailwind CSS for styling with a focus on:
- Clean, modern interface
- Accessibility compliance
- Mobile-first responsive design
- Consistent color scheme and typography

## 🔧 Development

### Code Style
- ESLint configuration for code quality
- React hooks and modern patterns
- Component-based architecture
- Proper error handling and validation

### Project Status
✅ **Frontend Structure Complete** - Comprehensive React application structure with:
- Domain-driven feature organization
- Complete dependency setup (React 19, Vite 6, Tailwind CSS 4)
- State management with Zustand
- Offline capabilities with Dexie.js
- Database integration ready with Supabase
- Modern development tooling (ESLint, Prettier)

🚧 **Backend** - Python API implementation pending

## 📦 Dependencies

### Frontend Dependencies
- React & React DOM for UI framework
- React Router DOM for navigation
- Tailwind CSS for styling with @tailwindcss/forms
- Zustand for state management
- Supabase JS for backend services
- Dexie for offline storage
- HTML2PDF for receipt generation
- clsx for conditional class names
- Vite for development and build tooling
- ESLint and Prettier for code quality

### Upcoming Backend Dependencies
- Flask/FastAPI for REST API
- SQLAlchemy for database ORM
- PostgreSQL/MySQL for data storage
- JWT for authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

For questions or support, please contact the development team.

---

*Built with ❤️ for modern pharmacy management*
