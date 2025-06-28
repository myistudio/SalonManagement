import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    enabled: true,
  });

  // If we get a 401 error, user is not authenticated
  const isAuthError = error?.message?.includes('401');
  const user = data || null;
  const isAuthenticated = !!user && !isAuthError;

  return {
    user,
    isLoading: isLoading && !isAuthError,
    isAuthenticated,
  };
}
