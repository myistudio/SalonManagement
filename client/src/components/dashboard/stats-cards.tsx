import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, Waves, Crown } from "lucide-react";

interface StatsCardsProps {
  storeId: number;
}

export default function StatsCards({ storeId }: StatsCardsProps) {
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: [`/api/dashboard/stats/${storeId}`],
    enabled: !!storeId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Today's Revenue",
      value: `₹${parseFloat((stats as any)?.todayRevenue || '0').toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
      change: "+12.5% from yesterday",
      changeColor: "text-green-600"
    },
    {
      title: "Customers Served", 
      value: (stats as any)?.customersToday || 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      change: "+8 new customers",
      changeColor: "text-blue-600"
    },
    {
      title: "Services Done",
      value: (stats as any)?.servicesToday || 0,
      icon: Waves,
      color: "bg-purple-100 text-purple-600",
      change: "Most popular: Pedicure",
      changeColor: "text-purple-600"
    },
    {
      title: "Active Members",
      value: (stats as any)?.activeMembers || 0,
      icon: Crown,
      color: "bg-amber-100 text-amber-600",
      change: "3 VIP renewed today",
      changeColor: "text-amber-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon size={16} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className={`${stat.changeColor} text-sm font-medium`}>
                {stat.change.includes('%') ? stat.change.split(' ')[0] : stat.change.split(':')[0]}
              </span>
              <span className="text-gray-600 text-sm ml-1">
                {stat.change.includes('%') ? stat.change.split(' ').slice(1).join(' ') : 
                 stat.change.includes(':') ? ': ' + stat.change.split(':')[1] : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
