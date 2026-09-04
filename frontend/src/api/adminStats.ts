// Couche de données du dashboard admin, branchée sur /api/admin/stats/*
// (voir backend/src/routes/admin.routes.ts).

import adminApi from "../lib/adminAxios";

export type TimeRange = "7d" | "30d" | "90d";

export interface StatOverviewItem {
  key: string;
  label: string;
  value: number;
  deltaPct: number;
}

export interface StatsOverview {
  users: StatOverviewItem;
  activities: StatOverviewItem;
  participations: StatOverviewItem;
  messages: StatOverviewItem;
  notifications: StatOverviewItem;
  territoriesActive: number;
}

export interface UserEvolutionPoint {
  date: string;
  count: number;
}

export interface TerritoryBreakdownItem {
  code: string;
  name: string;
  count: number;
  percent: number;
}

export async function fetchStatsOverview(range: TimeRange): Promise<StatsOverview> {
  const res = await adminApi.get<{ success: boolean; overview: StatsOverview }>(
    "/api/admin/stats/overview",
    { params: { range } },
  );
  return res.data.overview;
}

export async function fetchUserEvolution(range: TimeRange): Promise<UserEvolutionPoint[]> {
  const res = await adminApi.get<{ success: boolean; points: UserEvolutionPoint[] }>(
    "/api/admin/stats/user-evolution",
    { params: { range } },
  );
  return res.data.points;
}

export async function fetchTerritoryBreakdown(range: TimeRange): Promise<TerritoryBreakdownItem[]> {
  const res = await adminApi.get<{ success: boolean; items: TerritoryBreakdownItem[] }>(
    "/api/admin/stats/territory-breakdown",
    { params: { range } },
  );
  return res.data.items;
}
