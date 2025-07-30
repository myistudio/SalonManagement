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
  MessageSquare,
  Receipt,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onOpenBilling?: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({ onOpenBilling = () => {}, isMobileMenuOpen = false, setIsMobileMenuOpen = () => {} }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Get user role for navigation filtering
  const userRole = (user as any)?.role || "cashier";

  // Organized menu items with proper grouping
  const menuItems = [
    // Core Operations
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/", 
      active: location === "/" || location === "/dashboard",
      group: "core"
    },
    { 
      icon: Calendar, 
      label: "Appointments", 
      path: "/appointments", 
      active: location === "/appointments",
      group: "core"
    },

    
    // Customer & Inventory Management
    { 
      icon: Users, 
      label: "Customers", 
      path: "/customers", 
      active: location === "/customers",
      group: "management"
    },
    { 
      icon: Package, 
      label: "Products", 
      path: "/inventory", 
      active: location === "/inventory",
      group: "management"
    },
    { 
      icon: Waves, 
      label: "Services", 
      path: "/services", 
      active: location === "/services",
      group: "management"
    },
    { 
      icon: Crown, 
      label: "Memberships", 
      path: "/memberships", 
      active: location === "/memberships",
      group: "management"
    },
    
    // Analytics
    { 
      icon: BarChart3, 
      label: "Reports", 
      path: "/reports", 
      active: location === "/reports",
      group: "analytics"
    },
    
    // Administration
    { 
      icon: Bus, 
      label: "Staff", 
      path: "/staff", 
      active: location === "/staff",
      group: "admin"
    },
    { 
      icon: BarChart3, 
      label: "Staff Performance", 
      path: "/staff-performance", 
      active: location === "/staff-performance",
      group: "admin"
    },
    { 
      icon: Building2, 
      label: "Stores", 
      path: "/stores", 
      active: location === "/stores",
      group: "admin"
    },
    { 
      icon: Settings, 
      label: "Settings", 
      path: "/settings", 
      active: location === "/settings",
      group: "admin"
    },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    // Show all items for super_admin
    if (userRole === "super_admin") return true;
    // For store_manager, hide Stores (only super_admin can manage multiple stores)
    if (userRole === "store_manager") {
      return !["Stores"].includes(item.label);
    }
    // For executives, hide Reports, Staff, Settings, WhatsApp, and Stores
    if (userRole === "executive") {
      return !["Reports", "Staff", "Staff Performance", "Settings", "WhatsApp", "Stores"].includes(item.label);
    }
    return true;
  });

  // Group menu items by their group property
  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof filteredMenuItems>);

  const renderMenuSection = (title: string, items: typeof filteredMenuItems, isMobile = false) => {
    const itemClass = isMobile 
      ? "group flex items-center px-2 py-3 text-base font-medium rounded-md btn-touch"
      : "group flex items-center px-2 py-2 text-sm font-medium rounded-md";
    
    const iconSize = isMobile ? "h-6 w-6" : "h-5 w-5";
    
    return (
      <div className="mb-6">
        <h3 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                itemClass,
                item.active
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              onClick={isMobile ? () => setIsMobileMenuOpen(false) : undefined}
            >
              <item.icon className={cn("mr-3", iconSize)} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>

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
            <nav className="flex-1 px-2">
              {/* Quick Action - Billing */}
              <div className="mb-6">
                <h3 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Quick Actions
                </h3>
                <button
                  onClick={() => {
                    onOpenBilling();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-3 text-base font-medium rounded-md w-full text-left btn-touch"
                >
                  <CreditCard className="mr-3 h-6 w-6" />
                  New Bill
                </button>
              </div>
              
              {/* Grouped Menu Items */}
              {groupedMenuItems.core && renderMenuSection("Core Operations", groupedMenuItems.core, true)}
              {groupedMenuItems.management && renderMenuSection("Management", groupedMenuItems.management, true)}
              {groupedMenuItems.analytics && renderMenuSection("Analytics", groupedMenuItems.analytics, true)}
              {groupedMenuItems.communication && renderMenuSection("Communication", groupedMenuItems.communication, true)}
              {groupedMenuItems.admin && renderMenuSection("Administration", groupedMenuItems.admin, true)}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:top-16 z-10">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex-grow flex flex-col">
              <nav className="flex-1 px-2">
                {/* Quick Action - Billing */}
                <div className="mb-6">
                  <h3 className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Quick Actions
                  </h3>
                  <button
                    onClick={onOpenBilling}
                    className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left"
                  >
                    <CreditCard className="mr-3 h-5 w-5" />
                    New Bill
                  </button>
                </div>
                
                {/* Grouped Menu Items */}
                {groupedMenuItems.core && renderMenuSection("Core Operations", groupedMenuItems.core)}
                {groupedMenuItems.management && renderMenuSection("Management", groupedMenuItems.management)}
                {groupedMenuItems.analytics && renderMenuSection("Analytics", groupedMenuItems.analytics)}
                {groupedMenuItems.communication && renderMenuSection("Communication", groupedMenuItems.communication)}
                {groupedMenuItems.admin && renderMenuSection("Administration", groupedMenuItems.admin)}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
