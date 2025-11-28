import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Building2, LogOut, Plus, List, User, MessageSquarePlus } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      // Redirect admins to admin dashboard
      if (data.role === "admin") {
        navigate("/admin");
        return;
      }

      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
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
            <h1 className="text-xl font-bold">PG Connect</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Card */}
        <Card className="mb-8 shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back, {profile?.full_name || "Resident"}!</CardTitle>
            <CardDescription>
              {profile?.room_number ? `Room ${profile.room_number}` : "Manage your requests and feedback"}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card
            className="hover:shadow-hover transition-smooth cursor-pointer group animate-fade-in"
            style={{ animationDelay: "0.1s" }}
            onClick={() => navigate("/submit-request")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-smooth">
                <MessageSquarePlus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Submit Request</h3>
              <p className="text-sm text-muted-foreground">
                Submit a new complaint or feedback
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-hover transition-smooth cursor-pointer group animate-fade-in"
            style={{ animationDelay: "0.2s" }}
            onClick={() => navigate("/my-requests")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary/10 rounded-2xl flex items-center justify-center group-hover:bg-secondary/20 transition-smooth">
                <List className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">My Requests</h3>
              <p className="text-sm text-muted-foreground">
                View and track your submissions
              </p>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-hover transition-smooth cursor-pointer group animate-fade-in"
            style={{ animationDelay: "0.3s" }}
            onClick={() => navigate("/profile")}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-2xl flex items-center justify-center group-hover:bg-accent/20 transition-smooth">
                <User className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Profile</h3>
              <p className="text-sm text-muted-foreground">
                Update your information
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
