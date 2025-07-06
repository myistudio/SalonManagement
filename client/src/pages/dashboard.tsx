import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentActivity from "@/components/dashboard/recent-activity";
import LowStockAlerts from "@/components/dashboard/low-stock-alerts";
import BillingModal from "@/components/billing/billing-modal";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedStoreId, setSelectedStoreId] = useState<number>(7);
  const [showBillingModal, setShowBillingModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header selectedStoreId={selectedStoreId} onStoreChange={setSelectedStoreId} />
      
      <div className="flex">
        <Sidebar onOpenBilling={() => setShowBillingModal(true)} />
        
        <main className="flex-1 lg:ml-64">
          <div className="p-4 sm:p-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
              <p className="mt-1 text-gray-600">Welcome back! Here's what's happening at your salon today.</p>
            </div>

            <StatsCards storeId={selectedStoreId} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <QuickActions onOpenBilling={() => setShowBillingModal(true)} />
              </div>
              <LowStockAlerts storeId={selectedStoreId} />
            </div>

            <RecentActivity storeId={selectedStoreId} />
          </div>
        </main>
      </div>

      <BillingModal 
        isOpen={showBillingModal} 
        onClose={() => setShowBillingModal(false)} 
        storeId={selectedStoreId}
      />

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 py-2">
          <button className="flex flex-col items-center py-2 text-primary">
            <i className="fas fa-tachometer-alt text-lg"></i>
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button 
            className="flex flex-col items-center py-2 text-gray-500"
            onClick={() => setShowBillingModal(true)}
          >
            <i className="fas fa-cash-register text-lg"></i>
            <span className="text-xs mt-1">Billing</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-500">
            <i className="fas fa-users text-lg"></i>
            <span className="text-xs mt-1">Customers</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-500">
            <i className="fas fa-boxes text-lg"></i>
            <span className="text-xs mt-1">Inventory</span>
          </button>
          <button className="flex flex-col items-center py-2 text-gray-500">
            <i className="fas fa-chart-bar text-lg"></i>
            <span className="text-xs mt-1">Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}
