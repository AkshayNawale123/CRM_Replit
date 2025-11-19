import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { SiApple, SiGoogle } from "react-icons/si";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple auth - just check if fields are filled
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Side - Form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-primary">
              <span className="text-lg font-bold text-primary">CT</span>
            </div>
            <span className="text-xl font-semibold text-foreground">Cybaem Tech</span>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your client relationships
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  autoComplete="email"
                  data-testid="input-email"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    autoComplete="current-password"
                    data-testid="input-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium"
              data-testid="button-login"
            >
              Sign in
            </Button>

            {/* Social Login */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  data-testid="button-apple-login"
                >
                  <SiApple className="mr-2 h-5 w-5" />
                  Apple
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12"
                  data-testid="button-google-login"
                >
                  <SiGoogle className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </div>
            </div>
          </form>

          {/* Footer Links */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <button className="text-primary hover:underline font-medium" data-testid="link-signup">
                Sign up
              </button>
            </p>
            <button className="text-muted-foreground hover:text-foreground" data-testid="link-terms">
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Visual */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500">
        {/* Decorative Wave Pattern */}
        <div className="absolute inset-0">
          <svg
            className="absolute left-0 top-0 h-full w-auto"
            viewBox="0 0 400 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 0C100 100 100 200 0 300C-100 400 -100 500 0 600C100 700 100 800 0 800V0Z"
              fill="rgba(255,255,255,0.1)"
            />
            <path
              d="M50 0C150 120 150 240 50 360C-50 480 -50 600 50 720C150 800 150 800 50 800V0Z"
              fill="rgba(255,255,255,0.05)"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Floating Card - Task */}
          <Card className="absolute top-20 right-20 p-4 bg-white/90 backdrop-blur-sm shadow-xl max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Pipeline Progress</span>
              <span className="text-xs text-muted-foreground">Q4 2024</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full" />
              </div>
              <span className="text-sm font-semibold text-foreground">67%</span>
            </div>
          </Card>

          {/* Main Message */}
          <div className="text-center space-y-4 max-w-lg">
            <h2 className="text-4xl font-bold drop-shadow-lg">
              Manage Your Client Relationships
            </h2>
            <p className="text-xl text-white/90 drop-shadow">
              Track deals, monitor pipeline stages, and close more deals with powerful CRM tools
            </p>
          </div>

          {/* Floating Card - Metrics */}
          <Card className="absolute bottom-20 left-20 p-4 bg-white/90 backdrop-blur-sm shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">
                  45
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New Leads</p>
                  <p className="text-sm font-semibold text-foreground">This Week</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
