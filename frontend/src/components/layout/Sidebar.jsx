import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/add', label: 'Add', icon: 'add_circle', hasSubmenu: true },
    { path: '/add-drug', label: 'Add Drug', icon: 'medication', indent: true },
    { path: '/add-stock', label: 'Add Stock', icon: 'inventory', indent: true },
    { path: '/all-drugs', label: 'All Drugs', icon: 'list' },
    { path: '/user', label: 'User', icon: 'person', hasSubmenu: true },
    { path: '/reports', label: 'Reports', icon: 'analytics', hasSubmenu: true },
    { path: '/sale-reversals', label: 'Sale Reversals', icon: 'undo', hasSubmenu: true },
    { path: '/logout', label: 'Logout', icon: 'logout' },
  ];

  return (
    <div className="h-screen w-64 flex-shrink-0 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-800 shadow-lg">
      <div className="p-4 flex items-center border-b border-gray-700 border-opacity-50">
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold mr-3 shadow-md">
          A
        </div>
        <h1 className="text-white text-xl font-bold tracking-wider">Elith-PHARMA</h1>
      </div>
      
      <nav className="mt-6 px-2">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  item.indent ? 'ml-4 text-sm' : ''
                } ${
                  isActive(item.path) 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-300 hover:bg-gray-700 hover:bg-opacity-50'
                }`}
              >
                <span className={`material-icons ${item.indent ? 'text-base' : 'text-xl'} mr-3`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.hasSubmenu && !item.indent && (
                  <span className="material-icons ml-auto text-sm">expand_more</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 border-opacity-50">
        <div className="flex items-center px-4 py-2 text-gray-400 text-sm">
          <span className="material-icons mr-2 text-sm">info</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 