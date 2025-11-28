import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, User, MessageSquare } from "lucide-react";
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
  updated_at: string;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
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

const RequestDetail = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      } else {
        loadRequest();
        loadComments();
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
  }, [navigate, id]);

  const loadRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setRequest(data);
    } catch (error: any) {
      toast({
        title: "Error loading request",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("request_comments")
        .select(`
          id,
          comment,
          created_at,
          profiles:user_id (
            full_name,
            role
          )
        `)
        .eq("request_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments(data as any || []);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Request not found</h2>
          <Button onClick={() => navigate("/my-requests")}>
            Back to Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/my-requests")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Requests
        </Button>

        <Card className="shadow-lg animate-fade-in">
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-3">{request.title}</CardTitle>
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created: {format(new Date(request.created_at), "MMM dd, yyyy 'at' h:mm a")}
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{request.description}</p>
            </div>

            {comments.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Updates & Comments
                  </h3>
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <Card key={comment.id} className="bg-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {comment.profiles.full_name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {comment.profiles.role}
                                </Badge>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {format(new Date(comment.created_at), "MMM dd, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                              <p className="text-sm">{comment.comment}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RequestDetail;
