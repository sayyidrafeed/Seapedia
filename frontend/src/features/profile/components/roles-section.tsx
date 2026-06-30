interface RolesSectionProps {
  activeRole: string | null;
  roles: string[];
}

export function RolesSection({ activeRole, roles }: RolesSectionProps) {
  return (
    <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
      <h2 className="text-xl font-bold border-b border-border pb-3">Roles & Session</h2>
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase">Active Role</span>
        <p className="text-foreground font-semibold mt-1 capitalize text-primary">
          {activeRole || 'None'}
        </p>
      </div>
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase">Roles Owned</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {roles.map((r) => (
            <span
              key={r}
              className="rounded-full bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 capitalize border border-border"
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
