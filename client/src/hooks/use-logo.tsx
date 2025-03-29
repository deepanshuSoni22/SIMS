import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Default logo to use if none is set
import defaultLogo from "../assets/soundarya_logo.png";

export function useLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(defaultLogo);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/settings/logo'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/settings/logo');
      return await res.json();
    }
  });

  useEffect(() => {
    if (data?.logoUrl) {
      setLogoUrl(data.logoUrl);
    }
  }, [data]);

  return {
    logoUrl,
    isLoading,
    error,
    isDefaultLogo: !data?.logoUrl
  };
}