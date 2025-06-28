import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves, Users, Package, CreditCard, Award, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-cyan-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary mb-4">SalonPro</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Complete multi-store salon management system with billing, inventory, customer management, and loyalty programs
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-3">
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Quick billing with QR code scanning, automatic discounts, and loyalty point redemption
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle>Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track customer visits, manage profiles, and build lasting relationships
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <CardTitle>Inventory Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Real-time stock tracking with low stock alerts and automatic reorder points
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Waves className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Service Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage services, pricing, and track performance across all locations
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Loyalty Programs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Flexible membership plans with custom benefits and automatic point calculation
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Analytics & Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comprehensive reporting with sales analytics and performance insights
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-2xl p-12 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Salon Business?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of salon owners who trust SalonPro to manage their business efficiently
          </p>
          <Button onClick={handleLogin} size="lg" className="text-lg px-8 py-3">
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
}
