import { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '../types/index';
import { useAuth } from '../hooks/useAuth';

export const useAdminStats = () => {
  const { token, user } = useAuth(); //_ 3. Get the token from our central auth context
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchStats = useCallback(async () => {
    if (user?.user_role !== 'admin') {
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }, //_ 5. Use the token from context
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      
      const result = await response.json();
      //_ 6. Handle the standard API response shape
      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user, API_BASE_URL]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};