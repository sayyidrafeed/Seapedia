interface WilayahResponseItem {
  code: string;
  name: string;
}

interface WilayahResponse {
  data: WilayahResponseItem[];
}

export class LocationsProvider {
  private static cache = new Map<string, unknown>();

  static async getProvinces(): Promise<{ id: string; name: string }[]> {
    const cacheKey = 'provinces';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as { id: string; name: string }[];
    }

    try {
      const res = await fetch('https://wilayah.id/api/provinces.json');
      if (!res.ok) throw new Error(`Wilayah API error: ${res.statusText}`);
      const json = (await res.json()) as WilayahResponse;
      const data = json.data.map((item) => ({
        id: item.code,
        name: item.name,
      }));
      this.cache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error('Error fetching provinces from Wilayah API', err);
      throw err;
    }
  }

  static async getCities(provinceId: string): Promise<{ id: string; name: string }[]> {
    const cacheKey = `cities:${provinceId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as { id: string; name: string }[];
    }

    try {
      const res = await fetch(`https://wilayah.id/api/regencies/${provinceId}.json`);
      if (!res.ok) throw new Error(`Wilayah API error: ${res.statusText}`);
      const json = (await res.json()) as WilayahResponse;
      const data = json.data.map((item) => ({
        id: item.code,
        name: item.name,
      }));
      this.cache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error(`Error fetching cities for province ${provinceId} from Wilayah API`, err);
      throw err;
    }
  }

  static async getDistricts(cityId: string): Promise<{ id: string; name: string }[]> {
    const cacheKey = `districts:${cityId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as { id: string; name: string }[];
    }

    try {
      const res = await fetch(`https://wilayah.id/api/districts/${cityId}.json`);
      if (!res.ok) throw new Error(`Wilayah API error: ${res.statusText}`);
      const json = (await res.json()) as WilayahResponse;
      const data = json.data.map((item) => ({
        id: item.code,
        name: item.name,
      }));
      this.cache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.error(`Error fetching districts for city ${cityId} from Wilayah API`, err);
      throw err;
    }
  }

  static async validateHierarchy(
    provinceName: string,
    cityName: string,
    districtName: string,
  ): Promise<boolean> {
    try {
      const provinces = await this.getProvinces();
      const province = provinces.find((p) => p.name.toLowerCase() === provinceName.toLowerCase());
      if (!province) return false;

      const cities = await this.getCities(province.id);
      const city = cities.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
      if (!city) return false;

      const districts = await this.getDistricts(city.id);
      const district = districts.find((d) => d.name.toLowerCase() === districtName.toLowerCase());
      if (!district) return false;

      return true;
    } catch (err) {
      console.error('Error validating location hierarchy', err);
      return false; // Fail closed
    }
  }
}
