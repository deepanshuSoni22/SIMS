import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// We'll create an auth wrapper component to handle the route protection
function AuthWrapper({
  children,
  allowedRoles = [],
  redirectTo = "/auth",
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}) {
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    console.error("Auth context error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-700 mb-4">
            There was a problem with authentication. Please try refreshing the page.
          </p>
          <p className="text-gray-600 text-sm">
            Error: {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
      </div>
    );
  }

  const { user, isLoading } = auth;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to={redirectTo} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-4">
            You don't have permission to access this page. This page is restricted to {allowedRoles.join(', ')} roles.
          </p>
          <p className="text-gray-600">
            Please contact an administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = [],
}: {
  path: string;
  component: () => React.JSX.Element;
  allowedRoles?: string[];
}) {
  // Use a regular route but wrap the component with our AuthWrapper
  return (
    <Route path={path}>
      {/* The AuthWrapper will be instantiated only if the route matches */}
      <AuthWrapper allowedRoles={allowedRoles}>
        <Component />
      </AuthWrapper>
    </Route>
  );
}
