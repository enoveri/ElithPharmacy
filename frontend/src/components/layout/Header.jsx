import { useState, useEffect } from 'react';

const Header = () => {
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Format date as "Thursday, November 25, 2021"
  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Format time as "07:01:39"
  const hours = time.getHours() % 12 || 12;
  const formattedHours = hours.toString().padStart(2, '0');
  const formattedMinutes = time.getMinutes().toString().padStart(2, '0');
  const formattedSeconds = time.getSeconds().toString().padStart(2, '0');
  const amPm = time.getHours() >= 12 ? 'PM' : 'AM';
  
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
        <div className="flex items-center">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              <span className="material-icons">search</span>
            </span>
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <span className="material-icons text-gray-600">settings</span>
          </button>
          <div className="relative">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <span className="material-icons text-gray-600">notifications</span>
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="text-center text-sm font-medium mb-1 text-gray-600">
            {formattedDate}
          </div>
          <div className="flex items-center justify-center">
            <div className="text-2xl font-bold tracking-wider text-gray-800">
              {formattedHours}:{formattedMinutes}:{formattedSeconds}
            </div>
            <div className="ml-2 bg-blue-100 px-2 py-1 rounded text-blue-600 text-xs font-bold">
              {amPm}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header; 