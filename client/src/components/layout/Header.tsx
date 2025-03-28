import { useAuth } from "@/hooks/use-auth";
import { Bell, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  toggleSidebar: () => void;
  title: string;
}

export default function Header({ toggleSidebar, title }: HeaderProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </Button>
          <h1 className="ml-3 lg:ml-0 text-lg lg:text-xl font-medium text-gray-800">
            {title}
          </h1>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-gray-600 mx-3">
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="h-2 w-2 p-0 absolute top-0 right-0" 
              />
            </Button>
          </div>
          <div className="mx-3 relative">
            <Button variant="ghost" size="icon" className="text-gray-600">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
          <div className="ml-3 relative hidden lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <span className="font-medium text-sm text-gray-700">{user?.name}</span>
                  <Avatar className="h-8 w-8 bg-gray-300 text-primary">
                    <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
                  {user?.role.toUpperCase()}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
