// src/pages/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react';
import {
  Shield,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorClass,
}) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="mt-4">
      <p className="text-sm text-gray-500">{description}</p>
      {trend && (
        <p className="mt-1 text-sm font-medium text-green-600">{trend}</p>
      )}
    </div>
  </div>
);

const RecentActivity = ({ activities }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50">
    <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
    <div className="mt-4 space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center space-x-4">
          <div className={`p-2 rounded-full ${activity.iconBg}`}>
            <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {activity.title}
            </p>
            <p className="text-sm text-gray-500">{activity.description}</p>
          </div>
          <p className="text-sm text-gray-500">{activity.time}</p>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const [statistics, setStatistics] = useState({
    repositories: 0,
    vulnerabilities: 0,
    scannedImages: 0,
    lastScanTime: null,
  });

  const awsCredentials = useAuthStore((state) => state.awsCredentials);

  const recentActivities = [
    {
      title: 'New vulnerability detected',
      description: 'High severity issue found in nginx:latest',
      time: '5m ago',
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      title: 'Scan completed',
      description: 'Successfully scanned frontend-app:v1.2.0',
      time: '15m ago',
      icon: CheckCircle,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Repository added',
      description: 'New repository backend-api created',
      time: '1h ago',
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ];

  useEffect(() => {
    // Fetch statistics here
    // This is a placeholder for demonstration
    setStatistics({
      repositories: 12,
      vulnerabilities: 23,
      scannedImages: 45,
      lastScanTime: new Date(),
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Repositories"
          value={statistics.repositories}
          icon={Package}
          description="Active ECR repositories"
          trend="+2 this week"
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Vulnerabilities"
          value={statistics.vulnerabilities}
          icon={Shield}
          description="Across all repositories"
          trend="5 critical"
          colorClass="bg-red-100 text-red-600"
        />
        <StatCard
          title="Scanned Images"
          value={statistics.scannedImages}
          icon={CheckCircle}
          description="Total container images"
          trend="98% coverage"
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard
          title="Last Scan"
          value="5m ago"
          icon={Clock}
          description="Continuous monitoring active"
          trend="Real-time updates"
          colorClass="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivities} />

        {/* Additional dashboard widgets can go here */}
      </div>
    </div>
  );
};

export default Dashboard;
