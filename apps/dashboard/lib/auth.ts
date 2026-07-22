export type DashboardRole="ADMIN"|"MANAGER"|"MARKETPLACE_REP";
const rank:Record<DashboardRole,number>={MARKETPLACE_REP:1,MANAGER:2,ADMIN:3};
export function requireRole(minimum:DashboardRole){const configured=(process.env.DASHBOARD_ROLE??"MARKETPLACE_REP") as DashboardRole;if(!(configured in rank)||rank[configured]<rank[minimum])throw new Error(`${minimum} role required`);return configured}
