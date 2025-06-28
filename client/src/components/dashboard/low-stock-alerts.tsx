import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface LowStockAlertsProps {
  storeId: number;
}

export default function LowStockAlerts({ storeId }: LowStockAlertsProps) {
  const { data: lowStockProducts = [], isLoading } = useQuery({
    queryKey: [`/api/products/low-stock/${storeId}`],
    enabled: !!storeId,
  });

  return (
    <Card className="rounded-xl shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Low Stock Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-12"></div>
              </div>
            ))
          ) : lowStockProducts.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>All products are well stocked!</p>
            </div>
          ) : (
            lowStockProducts.map((product: any) => (
              <div 
                key={product.id} 
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">Only {product.stock} left</p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Low
                </Badge>
              </div>
            ))
          )}
        </div>
        <Link href="/inventory">
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-sm text-primary hover:text-primary"
          >
            View all alerts
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
