// src/hooks/useCommonState.tsx
import { useState, useCallback } from 'react';

export const useLoadingState = (initialLoading = false) => {
  const [loading, setLoading] = useState(initialLoading);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
    if (isLoading) setError(null);
  }, []);

  const setRefreshingState = useCallback((isRefreshing: boolean) => {
    setRefreshing(isRefreshing);
    if (isRefreshing) setError(null);
  }, []);

  const setErrorState = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    setLoading(false);
    setRefreshing(false);
  }, []);

  return {
    loading,
    refreshing,
    error,
    setLoading: setLoadingState,
    setRefreshing: setRefreshingState,
    setError: setErrorState,
  };
};

export const useSearchState = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const filterBySearch = useCallback(
    function<T>(items: T[], searchFields: (keyof T)[]): T[] {
      if (!searchQuery.trim()) return items;
      
      const query = searchQuery.toLowerCase();
      return items.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (Array.isArray(value)) {
            return value.some(v => 
              typeof v === 'string' && v.toLowerCase().includes(query)
            );
          }
          return false;
        })
      );
    },
    [searchQuery]
  );

  return {
    searchQuery,
    setSearchQuery,
    clearSearch,
    filterBySearch,
  };
};
