import { useQuery } from '@tanstack/react-query';
import { getProvinces, getCities, getDistricts } from '@/lib/api/generated';

export function useProvinces() {
  return useQuery({
    queryKey: ['locations', 'provinces'],
    queryFn: async () => {
      const res = await getProvinces();
      if (res.error) throw res.error;
      return res.data || [];
    },
    staleTime: Infinity,
  });
}

export function useCities(provinceId?: string) {
  return useQuery({
    queryKey: ['locations', 'cities', provinceId],
    queryFn: async () => {
      const res = await getCities({ query: { provinceId: provinceId! } });
      if (res.error) throw res.error;
      return res.data || [];
    },
    enabled: !!provinceId,
    staleTime: Infinity,
  });
}

export function useDistricts(cityId?: string) {
  return useQuery({
    queryKey: ['locations', 'districts', cityId],
    queryFn: async () => {
      const res = await getDistricts({ query: { cityId: cityId! } });
      if (res.error) throw res.error;
      return res.data || [];
    },
    enabled: !!cityId,
    staleTime: Infinity,
  });
}
