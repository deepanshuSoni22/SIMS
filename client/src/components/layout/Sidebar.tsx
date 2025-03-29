import { useAuth, roles } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import soundaryaLogo from "../../assets/soundarya_logo.png";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

type NavItem = {
  title: string;
  icon: string;
  path: string;
  allowedRoles: string[];
};

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        // Manually navigate to auth page after successful logout
        window.location.href = "/auth";
      }
    });
  };

  const navItems: NavItem[] = [
    { 
      title: "Dashboard", 
      icon: "home", 
      path: "/dashboard", 
      allowedRoles: [roles.ADMIN, roles.HOD, roles.FACULTY, roles.STUDENT] 
    },
    { 
      title: "User Management", 
      icon: "people", 
      path: "/users", 
      allowedRoles: [roles.ADMIN] 
    },
    { 
      title: "Departments", 
      icon: "school", 
      path: "/departments", 
      allowedRoles: [roles.ADMIN] 
    },
    { 
      title: "Faculty Management", 
      icon: "groups", 
      path: "/faculty-management", 
      allowedRoles: [roles.HOD] 
    },
    { 
      title: "Subjects", 
      icon: "book", 
      path: "/subjects", 
      allowedRoles: [roles.HOD, roles.FACULTY, roles.STUDENT] 
    },
    { 
      title: "Course Plans", 
      icon: "assignment", 
      path: "/course-plans", 
      allowedRoles: [roles.ADMIN, roles.HOD, roles.FACULTY, roles.STUDENT] 
    },
    { 
      title: "Attainments", 
      icon: "assessment", 
      path: "/attainments", 
      allowedRoles: [roles.ADMIN, roles.HOD, roles.FACULTY, roles.STUDENT] 
    },
    { 
      title: "Reports", 
      icon: "bar_chart", 
      path: "/reports", 
      allowedRoles: [roles.ADMIN, roles.HOD, roles.FACULTY] 
    },
    { 
      title: "Activity Logs", 
      icon: "history", 
      path: "/activity-logs", 
      allowedRoles: [roles.ADMIN] 
    },
    { 
      title: "Settings", 
      icon: "settings", 
      path: "/settings", 
      allowedRoles: [roles.ADMIN] 
    }
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "drawer-overlay fixed inset-0 z-20 lg:hidden bg-gray-800/50",
          isOpen ? "block" : "hidden"
        )}
        onClick={closeSidebar}
      ></div>
      
      {/* Drawer content */}
      <div 
        className={cn(
          "drawer bg-white w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 shadow-lg",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* App Logo with Soundarya Logo */}
          <div className="bg-primary p-2 text-white flex flex-col items-center justify-center">
            <img src={soundaryaLogo} alt="Soundarya Institute Logo" className="h-16 w-auto mb-1" />
            <h1 className="text-lg font-medium">COPO System</h1>
          </div>
          
          {/* User Profile */}
          <Link to="/profile" onClick={() => closeSidebar()}>
            <div className="p-4 border-b flex items-center cursor-pointer hover:bg-gray-50 group">
              <Avatar className="w-10 h-10 rounded-full bg-gray-300 text-primary">
                <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="font-medium text-gray-800 group-hover:text-primary">{user?.name}</p>
                <p className="text-sm text-gray-500">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}</p>
              </div>
            </div>
          </Link>
          
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto pt-2">
            <div className="px-2 space-y-1">
              {navItems.map((item) => {
                // Skip menu items that user shouldn't see
                if (!user || !item.allowedRoles.includes(user.role)) {
                  return null;
                }
                
                const isActive = location === item.path;
                
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    onClick={() => closeSidebar()}
                  >
                    <div 
                      className={cn(
                        "flex items-center py-2.5 text-sm font-medium cursor-pointer",
                        isActive 
                          ? "border-l-4 border-primary text-primary bg-gray-50 pl-2" 
                          : "text-gray-700 hover:bg-gray-100 px-3"
                      )}
                    >
                      <span className={cn(
                        "material-icons mr-3",
                        isActive 
                          ? "text-primary" 
                          : "text-gray-600"
                      )}>
                        {item.icon}
                      </span>
                      <span className="font-medium">
                        {item.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t space-y-3">
            <Link to="/profile" onClick={() => closeSidebar()}>
              <div className="flex items-center text-gray-600 hover:text-primary w-full cursor-pointer">
                <UserIcon className="h-5 w-5 mr-3" />
                My Profile
              </div>
            </Link>
            <button 
              className="flex items-center text-gray-600 hover:text-primary w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
