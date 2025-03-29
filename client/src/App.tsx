import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "./lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import UserManagementPage from "@/pages/user-management-page";
import DepartmentPage from "@/pages/department-page";
import SubjectPage from "@/pages/subject-page";
import CoursePlanPage from "@/pages/course-plan-page";
import AttainmentPage from "@/pages/attainment-page";
import ReportPage from "@/pages/report-page";
import FacultyManagementPage from "@/pages/faculty-management-page";
import { roles } from "@shared/schema";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute 
        path="/" 
        component={() => <DashboardPage />} 
      />
      <ProtectedRoute 
        path="/dashboard" 
        component={() => <DashboardPage />} 
      />
      <ProtectedRoute 
        path="/users" 
        component={() => <UserManagementPage />} 
        allowedRoles={[roles.ADMIN, roles.HOD]}
      />
      <ProtectedRoute 
        path="/departments" 
        component={() => <DepartmentPage />} 
        allowedRoles={[roles.ADMIN, roles.HOD]}
      />
      <ProtectedRoute 
        path="/subjects" 
        component={() => <SubjectPage />} 
        allowedRoles={[roles.ADMIN, roles.HOD, roles.FACULTY, roles.STUDENT]}
      />
      <ProtectedRoute 
        path="/course-plans" 
        component={() => <CoursePlanPage />} 
        allowedRoles={[roles.ADMIN, roles.HOD, roles.FACULTY, roles.STUDENT]}
      />
      <ProtectedRoute 
        path="/attainments" 
        component={() => <AttainmentPage />} 
        allowedRoles={[roles.ADMIN, roles.HOD, roles.FACULTY, roles.STUDENT]}
      />
      <ProtectedRoute 
        path="/reports" 
        component={() => <ReportPage />} 
        allowedRoles={[roles.ADMIN, roles.HOD, roles.FACULTY]}
      />
      <ProtectedRoute 
        path="/faculty-management" 
        component={() => <FacultyManagementPage />} 
        allowedRoles={[roles.HOD]}
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
