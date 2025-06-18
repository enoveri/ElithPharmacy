import { RouterProvider } from "react-router-dom";
import { router } from "./routes/index.jsx";
import { AppProvider } from "./contexts/AppContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
