import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ActivityLog, 
  User 
} from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/layout/AppLayout";

export default function ActivityLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all activity logs
  const { data: activityLogs, isLoading: isLogsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  // Fetch users for displaying names
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter logs based on type and search query
  const filteredLogs = activityLogs?.filter(log => {
    // Filter by activity type if not set to "all"
    if (filterType !== "all" && log.action !== filterType) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const user = users?.find(user => user.id === log.userId);
      const searchText = [
        user?.name,
        user?.username,
        log.action,
        log.entityType,
        log.details
      ].filter(Boolean).join(" ").toLowerCase();
      
      return searchText.includes(searchQuery.toLowerCase());
    }

    return true;
  }) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const isLoading = isLogsLoading || isUsersLoading;

  // Get unique action types for filter dropdown
  const actionTypes = activityLogs 
    ? Array.from(new Set(activityLogs.map(log => log.action)))
    : [];

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AppLayout title="Activity Logs">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">System Activity Logs</h1>
          <p className="text-gray-600">
            View all user activities and actions performed in the system.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="md:w-1/3">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="md:w-1/3">
            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:w-1/3">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
                <SelectItem value="100">100 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                      <div className="mt-2 text-sm text-gray-500">Loading activity logs...</div>
                    </td>
                  </tr>
                ) : paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    const user = users?.find(user => user.id === log.userId);
                    const userInitial = user?.name?.charAt(0) || log.userId.toString().charAt(0);
                    
                    return (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 rounded-full bg-gray-200">
                              <AvatarFallback className="text-gray-600 text-sm">
                                {userInitial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user?.name || `User ${log.userId}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user?.username || ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="capitalize">{log.action}</span> {log.entityType}
                            {log.entityId ? ` #${log.entityId}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-md truncate">
                            {log.details || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                      No activity logs found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!isLoading && filteredLogs.length > 0 && (
            <div className="py-4 bg-gray-50 border-t border-gray-200">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show current page and neighbors
                    let pageNum = currentPage;
                    if (currentPage <= 3) {
                      // At beginning, show 1,2,3,4,5
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // At end, show last 5 pages
                      pageNum = totalPages - 4 + i;
                    } else {
                      // In middle, show current and 2 on each side
                      pageNum = currentPage - 2 + i;
                    }
                    
                    if (pageNum <= totalPages && pageNum >= 1) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={pageNum === currentPage}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              
              <div className="text-xs text-center text-gray-500 mt-2">
                Showing {paginatedLogs.length} of {filteredLogs.length} logs
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}