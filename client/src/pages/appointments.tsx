import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, Clock, User, Phone, Eye, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";

interface Store {
  id: number;
  name: string;
}

interface Appointment {
  id: number;
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export default function Appointments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedStoreId, setSelectedStoreId] = useState<number>(7); // Default to VEEPRESS
  const [selectedDate, setSelectedDate] = useState<string>(''); // Show all appointments by default
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch stores
  const { data: stores = [] } = useQuery({
    queryKey: ['/api/stores'],
  });

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['/api/appointments', selectedStoreId, selectedDate],
    queryFn: async () => {
      const url = selectedDate 
        ? `/api/appointments?storeId=${selectedStoreId}&date=${selectedDate}`
        : `/api/appointments?storeId=${selectedStoreId}`;
      const response = await apiRequest('GET', url);
      return response.json();
    },
    enabled: !!selectedStoreId,
  });

  // Update appointment status
  const updateAppointmentStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest('PUT', `/api/appointments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment status",
        variant: "destructive",
      });
    },
  });

  // Delete appointment
  const deleteAppointment = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        selectedStoreId={selectedStoreId}
        onStoreChange={setSelectedStoreId}
      />
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
              <p className="text-gray-600">Manage customer appointments and bookings</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="date-filter">Filter by Date (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                    placeholder="Select date to filter"
                  />
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate('')}
                      className="px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Appointments</p>
                    <p className="text-2xl font-bold">{appointments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">
                      {appointments.filter((apt: Appointment) => apt.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Confirmed</p>
                    <p className="text-2xl font-bold">
                      {appointments.filter((apt: Appointment) => apt.status === 'confirmed').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Cancelled</p>
                    <p className="text-2xl font-bold">
                      {appointments.filter((apt: Appointment) => apt.status === 'cancelled').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Appointments for {formatDate(selectedDate)}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No appointments found for this date
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment: Appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="font-medium">{formatTime(appointment.appointmentTime)}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{appointment.customerName}</div>
                            {appointment.gender && (
                              <div className="text-sm text-gray-500 capitalize">{appointment.gender}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {appointment.customerMobile}
                            </div>
                            {appointment.customerEmail && (
                              <div className="text-gray-500">{appointment.customerEmail}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{appointment.serviceName}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{appointment.duration} min</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">Rs. {appointment.totalAmount}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedAppointment(appointment);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {appointment.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: appointment.id, 
                                  status: 'confirmed' 
                                })}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            
                            {appointment.status === 'confirmed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateAppointmentStatus.mutate({ 
                                  id: appointment.id, 
                                  status: 'completed' 
                                })}
                              >
                                <CheckCircle className="h-4 w-4 text-blue-600" />
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteAppointment.mutate(appointment.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Name</Label>
                  <div className="font-medium">{selectedAppointment.customerName}</div>
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <div className="font-medium">{selectedAppointment.customerMobile}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="font-medium">{selectedAppointment.customerEmail || 'Not provided'}</div>
                </div>
                <div>
                  <Label>Gender</Label>
                  <div className="font-medium capitalize">{selectedAppointment.gender || 'Not specified'}</div>
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <div className="font-medium">
                    {selectedAppointment.dateOfBirth ? formatDate(selectedAppointment.dateOfBirth) : 'Not provided'}
                  </div>
                </div>
                <div>
                  <Label>Appointment Date</Label>
                  <div className="font-medium">{formatDate(selectedAppointment.appointmentDate)}</div>
                </div>
                <div>
                  <Label>Appointment Time</Label>
                  <div className="font-medium">{formatTime(selectedAppointment.appointmentTime)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedAppointment.status)}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Services</Label>
                <div className="font-medium">{selectedAppointment.serviceName}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duration</Label>
                  <div className="font-medium">{selectedAppointment.duration} minutes</div>
                </div>
                <div>
                  <Label>Total Amount</Label>
                  <div className="font-medium">Rs. {selectedAppointment.totalAmount}</div>
                </div>
              </div>
              
              {selectedAppointment.notes && (
                <div>
                  <Label>Notes</Label>
                  <div className="font-medium">{selectedAppointment.notes}</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created At</Label>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedAppointment.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label>Updated At</Label>
                  <div className="text-sm text-gray-600">
                    {new Date(selectedAppointment.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                {selectedAppointment.status === 'pending' && (
                  <Button
                    onClick={() => {
                      updateAppointmentStatus.mutate({ 
                        id: selectedAppointment.id, 
                        status: 'confirmed' 
                      });
                      setShowDetails(false);
                    }}
                    className="flex-1"
                  >
                    Confirm Appointment
                  </Button>
                )}
                
                {selectedAppointment.status === 'confirmed' && (
                  <Button
                    onClick={() => {
                      updateAppointmentStatus.mutate({ 
                        id: selectedAppointment.id, 
                        status: 'completed' 
                      });
                      setShowDetails(false);
                    }}
                    className="flex-1"
                  >
                    Mark as Completed
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    updateAppointmentStatus.mutate({ 
                      id: selectedAppointment.id, 
                      status: 'cancelled' 
                    });
                    setShowDetails(false);
                  }}
                  className="flex-1"
                >
                  Cancel Appointment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}