import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Building2, LogOut, Calendar, AlertCircle, MessageSquarePlus } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { format } from "date-fns";

interface Request {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    room_number: string;
  };
}

const statusColors = {
  pending: "bg-status-pending",
  in_progress: "bg-status-in-progress",
  resolved: "bg-status-resolved",
};

const priorityColors = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

const AdminDashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [comment, setComment] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        checkAdminRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    filterRequests();
  }, [requests, categoryFilter, statusFilter, priorityFilter]);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      loadRequests();
    } catch (error: any) {
      console.error("Error checking role:", error);
    }
  };

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          *,
          profiles:user_id (
            full_name,
            room_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data as any || []);
    } catch (error: any) {
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (categoryFilter !== "all") {
      filtered = filtered.filter((req) => req.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((req) => req.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest || !session?.user) return;

    setIsUpdating(true);

    try {
      // Update request status if changed
      if (newStatus && newStatus !== selectedRequest.status) {
        const { error: updateError } = await supabase
          .from("requests")
          .update({ status: newStatus as any })
          .eq("id", selectedRequest.id);

        if (updateError) throw updateError;
      }

      // Add comment if provided
      if (comment.trim()) {
        const { error: commentError } = await supabase
          .from("request_comments")
          .insert({
            request_id: selectedRequest.id,
            user_id: session.user.id,
            comment: comment.trim(),
          });

        if (commentError) throw commentError;
      }

      toast({
        title: "Request updated",
        description: "The request has been successfully updated.",
      });

      setSelectedRequest(null);
      setComment("");
      setNewStatus("");
      loadRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PG Connect Admin</h1>
              <p className="text-xs text-muted-foreground">Management Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">All Requests</h2>
          <p className="text-muted-foreground">
            Manage and respond to resident requests
          </p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="cleanliness">Cleanliness</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="fees">Fees</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {categoryFilter !== "all" || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No requests have been submitted yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => (
              <Dialog key={request.id}>
                <DialogTrigger asChild>
                  <Card
                    className="hover:shadow-hover transition-smooth cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => {
                      setSelectedRequest(request);
                      setNewStatus(request.status);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{request.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">{request.profiles.full_name}</span>
                            {request.profiles.room_number && (
                              <span>• Room {request.profiles.room_number}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${statusColors[request.status as keyof typeof statusColors]} text-white`}>
                          {request.status.replace("_", " ")}
                        </Badge>
                        <Badge className={`${priorityColors[request.priority as keyof typeof priorityColors]} text-white`}>
                          {request.priority}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {request.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(request.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedRequest?.title}</DialogTitle>
                  </DialogHeader>

                  {selectedRequest && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: <span className="font-medium text-foreground">{selectedRequest.profiles.full_name}</span>
                          {selectedRequest.profiles.room_number && ` (Room ${selectedRequest.profiles.room_number})`}
                        </p>
                        <p className="text-sm">{selectedRequest.description}</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Update Status</label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Add Comment</label>
                        <Textarea
                          placeholder="Add a comment or update for the resident..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={4}
                        />
                      </div>

                      <Button
                        onClick={handleUpdateRequest}
                        disabled={isUpdating || (!comment.trim() && newStatus === selectedRequest.status)}
                        className="w-full"
                      >
                        {isUpdating ? "Updating..." : "Update Request"}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
