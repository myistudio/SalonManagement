import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, UserPlus, QrCode, Package } from "lucide-react";
import { Link } from "wouter";

interface QuickActionsProps {
  onOpenBilling: () => void;
}

export default function QuickActions({ onOpenBilling }: QuickActionsProps) {
  const actions = [
    {
      icon: CreditCard,
      label: "New Bill",
      color: "bg-primary/10 text-primary hover:bg-primary/20",
      onClick: onOpenBilling
    },
    {
      icon: UserPlus,
      label: "Add Customer",
      color: "bg-secondary/10 text-secondary hover:bg-secondary/20",
      href: "/customers"
    },
    {
      icon: QrCode,
      label: "Scan QR",
      color: "bg-green-100 text-green-600 hover:bg-green-200",
      onClick: () => alert("QR Scanner would open here")
    },
    {
      icon: Package,
      label: "Inventory",
      color: "bg-amber-100 text-amber-600 hover:bg-amber-200",
      href: "/inventory"
    }
  ];

  return (
    <Card className="rounded-xl shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            action.href ? (
              <Link key={index} href={action.href}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center p-4 h-auto ${action.color} transition-colors border border-transparent hover:border-gray-300`}
                >
                  <action.icon size={24} className="mb-2" />
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                key={index}
                variant="ghost"
                onClick={action.onClick}
                className={`flex flex-col items-center p-4 h-auto ${action.color} transition-colors border border-transparent hover:border-gray-300`}
              >
                <action.icon size={24} className="mb-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
