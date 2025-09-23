import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-medicine.jpg";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        navigate("/");
      }
    });

    // Set initial tab from URL params
    const tab = searchParams.get("tab");
    if (tab === "signup") {
      setActiveTab("signup");
    }
  }, [navigate, searchParams]);

  const handleAuthSuccess = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
          {/* Left side - Hero */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold">
                Sistema de Busca de{" "}
                <span className="bg-gradient-medical bg-clip-text text-transparent">
                  Medicamentos Veterinários
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Encontre rapidamente medicamentos por doença, sintoma ou princípio ativo. 
                Gerencie seu banco de dados veterinário de forma profissional.
              </p>
            </div>
            
            <div className="rounded-lg overflow-hidden shadow-card">
              <img
                src={heroImage}
                alt="Sistema de medicamentos veterinários"
                className="w-full h-64 lg:h-80 object-cover"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Medicamentos</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-accent">9</div>
                <div className="text-sm text-muted-foreground">Espécies</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Forms */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex mb-6">
              <Button
                variant={activeTab === "login" ? "default" : "ghost"}
                onClick={() => setActiveTab("login")}
                className="flex-1 rounded-r-none"
              >
                Login
              </Button>
              <Button
                variant={activeTab === "signup" ? "default" : "ghost"}
                onClick={() => setActiveTab("signup")}
                className="flex-1 rounded-l-none"
              >
                Criar Conta
              </Button>
            </div>

            {activeTab === "login" ? (
              <LoginForm onSuccess={handleAuthSuccess} />
            ) : (
              <SignupForm onSuccess={handleAuthSuccess} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}