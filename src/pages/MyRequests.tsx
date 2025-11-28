import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, AlertCircle } from "lucide-react";
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

const MyRequests = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        loadRequests(session.user.id);
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
  }, [requests, categoryFilter, statusFilter]);

  const loadRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
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

    setFilteredRequests(filtered);
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Requests</h1>
          <p className="text-muted-foreground">
            Track and manage all your submissions
          </p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
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
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-muted-foreground mb-4">
                {categoryFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Submit your first request to get started"}
              </p>
              <Button onClick={() => navigate("/submit-request")}>
                Submit Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request, index) => (
              <Card
                key={request.id}
                className="hover:shadow-hover transition-smooth cursor-pointer animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => navigate(`/request/${request.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{request.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.description}
                      </p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
