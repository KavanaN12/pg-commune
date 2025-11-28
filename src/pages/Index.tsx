import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, MessageSquare, Users, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-lg animate-fade-in">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Welcome to PG Connect
          </h1>
          <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Seamless communication between PG residents and management. Submit requests, track responses, and stay connected.
          </p>
          <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button size="lg" onClick={() => navigate("/auth")} className="shadow-md">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-2xl bg-card shadow-md hover:shadow-hover transition-smooth animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Easy Communication</h3>
            <p className="text-muted-foreground">
              Submit complaints and feedback with just a few clicks. Track progress in real-time.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card shadow-md hover:shadow-hover transition-smooth animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="w-16 h-16 mx-auto mb-4 bg-secondary/10 rounded-2xl flex items-center justify-center">
              <Users className="w-8 h-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Resident Portal</h3>
            <p className="text-muted-foreground">
              Access your dashboard to manage all requests and receive updates from management.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card shadow-md hover:shadow-hover transition-smooth animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <div className="w-16 h-16 mx-auto mb-4 bg-accent/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Admin Management</h3>
            <p className="text-muted-foreground">
              Efficient tools for PG admins to respond to requests and maintain resident satisfaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
