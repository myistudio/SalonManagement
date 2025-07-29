import { useState, cloneElement, isValidElement } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Header from "./header";
import Sidebar from "./sidebar";
import BillingModal from "@/components/billing/billing-modal";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number>(1);
  console.log("AppLayout - selectedStoreId:", selectedStoreId);
  const [showBillingModal, setShowBillingModal] = useState(false);

  // Get stores for the header dropdown
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  // Don't render layout for non-authenticated users
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        selectedStoreId={selectedStoreId} 
        onStoreChange={setSelectedStoreId}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex">
        <Sidebar 
          onOpenBilling={() => setShowBillingModal(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        
        <main className="flex-1 lg:ml-64 pt-16">
          <div key={selectedStoreId}>
            {isValidElement(children) 
              ? cloneElement(children as React.ReactElement<any>, { selectedStoreId, key: selectedStoreId })
              : children}
          </div>
        </main>
      </div>

      {/* Billing Modal */}
      <BillingModal 
        isOpen={showBillingModal}
        onClose={() => setShowBillingModal(false)}
        storeId={selectedStoreId}
      />
    </div>
  );
}