export type StatisticsKpis = {
  smsSent: number;
  deliveryRate: number | null;
  stopCount: number;
  creditsConsumed: number;
};

export type CampaignSeriesPoint = {
  label: string;
  sent: number;
  failed: number;
  scheduled: number;
};

export type TopGroupStat = {
  groupName: string;
  contacts: number;
};

export type StatisticsSnapshot = {
  kpis: StatisticsKpis;
  campaignSeries: CampaignSeriesPoint[];
  topGroups: TopGroupStat[];
};
