import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface CollegeTitleData {
  collegeTitle: string;
  instituteName: string;
  systemName: string;
}

// Default values to use if none are set
const DEFAULT_COLLEGE_TITLE = "SOUNDARYA";
const DEFAULT_INSTITUTE_NAME = "INSTITUTE OF MANAGEMENT AND SCIENCE";
const DEFAULT_SYSTEM_NAME = "COPO Management System";

export function useCollegeTitle() {
  const { toast } = useToast();
  const [collegeTitleData, setCollegeTitleData] = useState<CollegeTitleData>({
    collegeTitle: DEFAULT_COLLEGE_TITLE,
    instituteName: DEFAULT_INSTITUTE_NAME,
    systemName: DEFAULT_SYSTEM_NAME
  });

  const { data, isLoading, error } = useQuery<CollegeTitleData>({
    queryKey: ['/api/settings/college-title'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings/college-title');
      return await res.json();
    }
  });

  useEffect(() => {
    if (data) {
      setCollegeTitleData({
        collegeTitle: data.collegeTitle || DEFAULT_COLLEGE_TITLE,
        instituteName: data.instituteName || DEFAULT_INSTITUTE_NAME,
        systemName: data.systemName || DEFAULT_SYSTEM_NAME
      });
    }
  }, [data]);
  
  const updateTitleMutation = useMutation({
    mutationFn: async (newData: CollegeTitleData) => {
      const res = await apiRequest('POST', '/api/settings/college-title', newData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/college-title'] });
      toast({
        title: "Title updated",
        description: "The college title has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update title",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  });

  return {
    collegeTitle: collegeTitleData.collegeTitle,
    instituteName: collegeTitleData.instituteName,
    systemName: collegeTitleData.systemName,
    isLoading,
    error,
    updateTitle: (data: CollegeTitleData) => updateTitleMutation.mutate(data),
    isUpdating: updateTitleMutation.isPending
  };
}