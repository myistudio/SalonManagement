import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { 
  BarChart3, 
  CreditCard, 
  Crown, 
  Package, 
  Waves, 
  Users, 
  Bus,
  LayoutDashboard,
  Settings,
  Building2,
  Menu,
  X,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onOpenBilling: () => void;
}

export default function Sidebar({ onOpenBilling }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get user role for navigation filtering
  const userRole = (user as any)?.role || "cashier";

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/", 
      active: location === "/" 
    },
    { 
      icon: Users, 
      label: "Customers", 
      path: "/customers", 
      active: location === "/customers" 
    },
    { 
      icon: Package, 
      label: "Inventory", 
      path: "/inventory", 
      active: location === "/inventory" 
    },
    { 
      icon: Waves, 
      label: "Services", 
      path: "/services", 
      active: location === "/services" 
    },
    { 
      icon: Crown, 
      label: "Memberships", 
      path: "/memberships", 
      active: location === "/memberships" 
    },
    { 
      icon: BarChart3, 
      label: "Reports", 
      path: "/reports", 
      active: location === "/reports" 
    },
    { 
      icon: Bus, 
      label: "Staff", 
      path: "/staff", 
      active: location === "/staff" 
    },
    { 
      icon: Building2, 
      label: "Stores", 
      path: "/stores", 
      active: location === "/stores" 
    },
    { 
      icon: MessageSquare, 
      label: "WhatsApp", 
      path: "/whatsapp", 
      active: location === "/whatsapp" 
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: "/settings", 
      active: location === "/settings" 
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // Show all items for super_admin
    if (userRole === "super_admin") return true;
    // For store_manager, hide Stores (only super_admin can manage multiple stores)
    if (userRole === "store_manager") {
      return !["Stores"].includes(item.label);
    }
    // For cashiers, hide Reports, Staff, Settings, WhatsApp, and Stores
    if (userRole === "cashier") {
      return !["Reports", "Staff", "Settings", "WhatsApp", "Stores"].includes(item.label);
    }
    return true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full border-r border-gray-200 pt-16 pb-4 overflow-y-auto">
          <div className="flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              <button
                onClick={() => {
                  onOpenBilling();
                  setIsMobileMenuOpen(false);
                }}
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-3 text-base font-medium rounded-md w-full text-left btn-touch"
              >
                <CreditCard className="mr-3 h-6 w-6" />
                Billing
              </button>
              
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "group flex items-center px-2 py-3 text-base font-medium rounded-md btn-touch",
                    item.active
                      ? "bg-primary text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-6 w-6" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:top-16">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                <button
                  onClick={onOpenBilling}
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left"
                >
                  <CreditCard className="mr-3 h-5 w-5" />
                  Billing
                </button>
                
                {filteredMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      item.active
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
