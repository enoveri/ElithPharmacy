# Elith Pharmacy

A modern pharmacy management system built with React and Python, designed to streamline pharmacy operations and improve customer service.

## 🏗️ Project Structure

```
Elith Pharmacy/
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── assets/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/            # Python backend API
│   └── requirements.txt
└── README.md
```

## 🚀 Tech Stack

### Frontend
- **React 19.1.0** - Modern UI library
- **Vite 6.3.5** - Fast build tool and development server
- **Tailwind CSS 4.1.8** - Utility-first CSS framework
- **ESLint** - Code linting and formatting

### Backend
- **Python** - Backend API (to be implemented)

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
🚧 **Currently in development** - This is an early-stage project with basic React setup completed.

## 📦 Dependencies

### Frontend Dependencies
- React & React DOM for UI
- Tailwind CSS for styling
- Vite for development and build tooling
- ESLint for code quality

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
