import { useEffect, useState } from "react";
import { useAuth, roles } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import HodDashboard from "@/components/dashboard/HodDashboard";
import FacultyDashboard from "@/components/dashboard/FacultyDashboard";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("Dashboard");

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case roles.ADMIN:
          setTitle("Admin Dashboard");
          break;
        case roles.HOD:
          setTitle("HOD Dashboard");
          break;
        case roles.FACULTY:
          setTitle("Faculty Dashboard");
          break;
        case roles.STUDENT:
          setTitle("Student Dashboard");
          break;
        default:
          setTitle("Dashboard");
      }
    }
  }, [user]);

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case roles.ADMIN:
        return <AdminDashboard />;
      case roles.HOD:
        return <HodDashboard />;
      case roles.FACULTY:
        return <FacultyDashboard />;
      case roles.STUDENT:
        return <StudentDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <AppLayout title={title}>
      {renderDashboard()}
    </AppLayout>
  );
}
