import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { Link } from "wouter";

interface RecentActivityProps {
  storeId: number;
}

export default function RecentActivity({ storeId }: RecentActivityProps) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: [`/api/transactions?storeId=${storeId}&limit=10`],
    enabled: !!storeId,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Transactions</CardTitle>
          <Link href="/reports">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View all
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="ml-3">
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No transactions yet</p>
            ) : (
              transactions.slice(0, 3).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Receipt size={16} className="text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{transaction.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.customer ? 
                          `${transaction.customer.firstName} ${transaction.customer.lastName || ''}` : 
                          'Walk-in Customer'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{parseFloat(transaction.totalAmount).toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Today's Appointments</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
            View schedule
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p>Appointment booking feature coming soon!</p>
              <p className="text-sm mt-2">Focus on billing and customer management for now.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
