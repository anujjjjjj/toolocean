import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useSEO({
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist.",
    path: location.pathname,
    noindex: true,
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-heading font-bold mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">Page not found</p>
          <Button
            onClick={() => navigate("/")}
          >
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
