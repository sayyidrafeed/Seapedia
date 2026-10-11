export interface RawUser {
  username: string;
  email: string;
  name: string;
  roles: string[];
  avatarUrl: string;
  createdAtDaysAgo: number;
}

export const rawUsers: RawUser[] = [
  {
    username: 'admin',
    email: 'admin@gmail.com',
    name: 'Raka Pratama',
    roles: ['admin'],
    avatarUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 30,
  },
  {
    username: 'budi_santoso',
    email: 'budi@gmail.com',
    name: 'Budi Santoso',
    roles: ['seller'],
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 28,
  },
  {
    username: 'aisyah_rahman',
    email: 'aisyah@gmail.com',
    name: 'Aisyah Rahman',
    roles: ['seller'],
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 27,
  },
  {
    username: 'dimas_el',
    email: 'dimas@gmail.com',
    name: 'Dimas Ramadhan',
    roles: ['seller'],
    avatarUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 26,
  },
  {
    username: 'maya_kusuma',
    email: 'maya@gmail.com',
    name: 'Maya Kusuma',
    roles: ['seller'],
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 25,
  },
  {
    username: 'fajar_nugroho',
    email: 'fajar@gmail.com',
    name: 'Fajar Nugroho',
    roles: ['seller'],
    avatarUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 24,
  },
  {
    username: 'dewi_lestari',
    email: 'dewi@gmail.com',
    name: 'Dewi Lestari',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 23,
  },
  {
    username: 'sari_dewi',
    email: 'sari@gmail.com',
    name: 'Sari Dewi',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 22,
  },
  {
    username: 'putri_anggraini',
    email: 'putri@gmail.com',
    name: 'Putri Anggraini',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 21,
  },
  {
    username: 'andi_prasetyo',
    email: 'andi@gmail.com',
    name: 'Andi Prasetyo',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 20,
  },
  {
    username: 'rizki_pratama',
    email: 'rizki@gmail.com',
    name: 'Rizki Pratama',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 19,
  },
  {
    username: 'nadia_saputri',
    email: 'nadia@gmail.com',
    name: 'Nadia Saputri',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 18,
  },
  {
    username: 'agus_setiawan',
    email: 'agus@gmail.com',
    name: 'Agus Setiawan',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 17,
  },
  {
    username: 'rina_wulandari',
    email: 'rina@gmail.com',
    name: 'Rina Wulandari',
    roles: ['buyer'],
    avatarUrl:
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 16,
  },
  {
    username: 'joko_widodo',
    email: 'joko@gmail.com',
    name: 'Joko Widodo',
    roles: ['driver'],
    avatarUrl:
      'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 25,
  },
  {
    username: 'budi_hartono',
    email: 'budi.h@gmail.com',
    name: 'Budi Hartono',
    roles: ['driver'],
    avatarUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 24,
  },
  {
    username: 'agus_wijaya',
    email: 'agus.w@gmail.com',
    name: 'Agus Wijaya',
    roles: ['driver'],
    avatarUrl:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 23,
  },
  {
    username: 'rina_multi',
    email: 'rina.m@gmail.com',
    name: 'Rina Multirole',
    roles: ['seller', 'buyer', 'driver'],
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAtDaysAgo: 29,
  },
];
