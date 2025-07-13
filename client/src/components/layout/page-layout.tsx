import { useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";

interface PageLayoutProps {
  children: React.ReactNode;
  selectedStoreId: number;
  onStoreChange: (storeId: number) => void;
  onOpenBilling: () => void;
  title?: string;
  subtitle?: string;
}

export default function PageLayout({ 
  children, 
  selectedStoreId, 
  onStoreChange, 
  onOpenBilling,
  title,
  subtitle
}: PageLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        selectedStoreId={selectedStoreId} 
        onStoreChange={onStoreChange}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      
      <div className="flex">
        <Sidebar 
          onOpenBilling={onOpenBilling}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        
        <main className="flex-1 lg:ml-64">
          <div className="p-4 sm:p-6">
            {(title || subtitle) && (
              <div className="mb-8">
                {title && <h2 className="text-3xl font-bold text-gray-900">{title}</h2>}
                {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}