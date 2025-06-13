import { FiTrendingUp } from 'react-icons/fi';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => {
  // Define background colors based on the color prop
  const bgColors = {
    blue: 'bg-blue-50 border-blue-200',
    teal: 'bg-teal-50 border-teal-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200'
  };
  
  // Define text colors
  const textColors = {
    blue: 'text-blue-600',
    teal: 'text-teal-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
    green: 'text-green-600'
  };
  
  // Define icon background colors
  const iconBgColors = {
    blue: 'bg-blue-100',
    teal: 'bg-teal-100',
    red: 'bg-red-100',
    orange: 'bg-orange-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100'
  };
  
  const bgColor = bgColors[color] || bgColors.blue;
  const textColor = textColors[color] || textColors.blue;
  const iconBgColor = iconBgColors[color] || iconBgColors.blue;
  
  return (
    <div className={`${bgColor}
        rounded-xl border
        p-6 shadow-sm
        transition-all
        duration-300
        hover:shadow-md
        min-h-[160px]
        min-w-[100px]`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className={`mt-2 text-3xl font-semibold ${textColor}`}>{value}</div>
          {trend && (
            <div className={`mt-2 flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <FiTrendingUp className={trend === 'down' ? 'rotate-180' : ''} size={16} />
              <span className="ml-1">{trendValue}%</span>
            </div>
          )}
        </div>
        <div className={`${iconBgColor} rounded-full p-3`}>
          <Icon className={`text-2xl ${textColor}`} size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;