import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  BarChart3, 
  CreditCard, 
  Crown, 
  Package, 
  Waves, 
  Users, 
  Bus,
  LayoutDashboard,
  Settings
} from "lucide-react";

interface SidebarProps {
  onOpenBilling: () => void;
}

export default function Sidebar({ onOpenBilling }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
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
      icon: Settings, 
      label: "Settings", 
      path: "/settings", 
      active: location === "/settings" 
    },
  ];

  return (
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
              
              {menuItems.filter(item => {
                // Show all items for super_admin and store_manager
                if (userRole === "super_admin" || userRole === "store_manager") return true;
                // For cashiers, hide Reports, Staff, and Settings
                if (userRole === "cashier") {
                  return !["Reports", "Staff", "Settings"].includes(item.label);
                }
                return true;
              }).map((item) => (
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
  );
}
