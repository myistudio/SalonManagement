import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, User, Phone, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  isActive: boolean;
}

interface AppointmentForm {
  storeId: number;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  dateOfBirth: string;
  gender: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceIds: string[];
  serviceName: string;
  totalAmount: string;
  duration: number;
  notes: string;
}

export default function AppointmentBooking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState<Partial<AppointmentForm>>({
    customerName: "",
    customerMobile: "",
    customerEmail: "",
    dateOfBirth: "",
    gender: "",
    notes: ""
  });

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ['/api/appointments/stores'],
  });

  // Fetch services for selected store
  const { data: services = [] } = useQuery({
    queryKey: ['/api/appointments/services', selectedStore?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/appointments/services/${selectedStore?.id}`);
      return response.json();
    },
    enabled: !!selectedStore,
  });

  // Fetch available time slots
  const { data: timeSlots = [] } = useQuery({
    queryKey: ['/api/appointments/time-slots', selectedStore?.id, selectedDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/appointments/time-slots/${selectedStore?.id}/${selectedDate}`);
      return response.json();
    },
    enabled: !!selectedStore && !!selectedDate,
  });

  // Create appointment mutation
  const createAppointment = useMutation({
    mutationFn: (appointment: AppointmentForm) => apiRequest('POST', '/api/appointments', appointment),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment booked successfully! We'll confirm your appointment soon.",
      });
      
      // Reset form
      setSelectedStore(null);
      setSelectedDate("");
      setSelectedTime("");
      setSelectedServices([]);
      setFormData({
        customerName: "",
        customerMobile: "",
        customerEmail: "",
        dateOfBirth: "",
        gender: "",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  // Calculate total duration (remove price calculation)
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleServiceToggle = (service: Service) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    if (isSelected) {
      setSelectedServices(selectedServices.filter(s => s.id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore || !selectedDate || !selectedTime || selectedServices.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!formData.customerName || !formData.customerMobile) {
      toast({
        title: "Error",
        description: "Please provide your name and mobile number",
        variant: "destructive",
      });
      return;
    }

    // Check age restriction (minimum 16 years)
    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 16) {
        toast({
          title: "Age Restriction",
          description: "Customers must be at least 16 years old to book appointments",
          variant: "destructive",
        });
        return;
      }
    }

    const appointmentData: AppointmentForm = {
      storeId: selectedStore.id,
      customerName: formData.customerName!,
      customerMobile: formData.customerMobile!,
      customerEmail: formData.customerEmail || "",
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender || "",
      appointmentDate: selectedDate,
      appointmentTime: selectedTime,
      serviceIds: selectedServices.map(s => s.id.toString()),
      serviceName: selectedServices.map(s => s.name).join(", "),
      totalAmount: "0",
      duration: totalDuration,
      notes: formData.notes || "",
    };

    createAppointment.mutate(appointmentData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Your Appointment</h1>
          <p className="text-gray-600">Choose your preferred salon, date, time, and services</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Selection Panel */}
          <div className="space-y-6">
            {/* Store Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Select Salon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {stores.map((store: Store) => (
                    <div
                      key={store.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedStore?.id === store.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStore(store)}
                    >
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                      <p className="text-sm text-gray-600">{store.address}</p>
                      <p className="text-sm text-purple-600">{store.phone}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Date Selection */}
            {selectedStore && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    className="w-full"
                  />
                </CardContent>
              </Card>
            )}

            {/* Time Selection */}
            {selectedStore && selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Select Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((slot: string) => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? "default" : "outline"}
                        onClick={() => setSelectedTime(slot)}
                        className="text-sm"
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                  {timeSlots.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No available time slots for this date</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Service Selection */}
            {selectedStore && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Services</CardTitle>
                  <CardDescription>Choose the services you'd like to book</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.map((service: Service) => (
                      <div
                        key={service.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedServices.find(s => s.id === service.id)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleServiceToggle(service)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{service.name}</h4>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline">{service.duration} min</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Booking Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerMobile">Mobile Number *</Label>
                    <Input
                      id="customerMobile"
                      type="tel"
                      value={formData.customerMobile}
                      onChange={(e) => setFormData({...formData, customerMobile: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email Address</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({...formData, gender: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="notes">Special Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Any special requests or notes..."
                    />
                  </div>

                  {/* Booking Summary */}
                  {selectedServices.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Booking Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Salon:</span>
                          <span>{selectedStore?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span>{selectedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span>{selectedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Services:</span>
                          <span>{selectedServices.map(s => s.name).join(", ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{totalDuration} minutes</span>
                        </div>

                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createAppointment.isPending}
                  >
                    {createAppointment.isPending ? "Booking..." : "Book Appointment"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}