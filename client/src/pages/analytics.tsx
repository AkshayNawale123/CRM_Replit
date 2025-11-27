import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, DollarSign, AlertCircle,
  Calendar, Award, Target, Globe, BarChart3, Briefcase, Trophy, Star
} from "lucide-react";
import type { Client } from "@shared/schema";
import { convertToINR, formatINR } from "@/lib/country-currency-data";

type ViewType = 'overview' | 'pipeline' | 'performance' | 'geographic' | 'services';

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  green: '#10b981',
  red: '#ef4444',
  cyan: '#06b6d4',
  emerald: '#22c55e',
};

const STAGE_COLORS: Record<string, string> = {
  'Lead': '#3b82f6',
  'Qualified': '#8b5cf6',
  'Meeting Scheduled': '#06b6d4',
  'Demo Completed': '#14b8a6',
  'Proof of Concept (POC)': '#10b981',
  'Proposal Sent': '#f59e0b',
  'Verbal Commitment': '#f97316',
  'Contract Review': '#ef4444',
  'Won': '#22c55e',
  'Lost': '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  'High': '#ef4444',
  'Medium': '#f59e0b',
  'Low': '#3b82f6',
};

const SERVICE_COLORS: Record<string, string> = {
  'ERP': '#3b82f6',
  'CRM': '#8b5cf6',
  'Product Development': '#06b6d4',
  'Mobile Development': '#14b8a6',
  'Website Creation': '#10b981',
  'Digital Marketing': '#f59e0b',
  'ITSM': '#f97316',
  'Other': '#6b7280',
};

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function KPICard({ title, value, subtitle, icon: Icon, trend = 'neutral', trendValue }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
            <h3 className="text-2xl font-bold text-foreground mt-1 truncate">{value}</h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
          </div>
          <div className={`p-2 rounded-lg shrink-0 ${
            trend === 'up' ? 'bg-green-100 dark:bg-green-900/30' :
            trend === 'down' ? 'bg-red-100 dark:bg-red-900/30' :
            'bg-blue-100 dark:bg-blue-900/30'
          }`}>
            <Icon className={`w-5 h-5 ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-blue-600 dark:text-blue-400'
            }`} />
          </div>
        </div>
        {trendValue && (
          <div className="flex items-center mt-2 gap-1">
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
            ) : null}
            <span className={`text-xs font-medium ${
              trend === 'up' ? 'text-green-600 dark:text-green-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-muted-foreground'
            }`}>{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [selectedView, setSelectedView] = useState<ViewType>('overview');

  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const analytics = useMemo(() => {
    if (!clients.length) return null;

    const totalClients = clients.length;
    const wonClients = clients.filter(c => c.stage === 'Won');
    const lostClients = clients.filter(c => c.stage === 'Lost');
    const inNegotiationClients = clients.filter(c => c.status === 'In Negotiation');
    const activeClients = clients.filter(c => c.stage !== 'Won' && c.stage !== 'Lost');

    const totalPipelineINR = clients.reduce((sum, c) => sum + convertToINR(c.value, c.country), 0);
    const activePipelineINR = activeClients.reduce((sum, c) => sum + convertToINR(c.value, c.country), 0);

    const wonCount = wonClients.length;
    const lostCount = lostClients.length;
    
    const closedDeals = [...wonClients, ...lostClients];
    const closedCount = closedDeals.length;
    
    const winRate = closedCount > 0
      ? ((wonCount / closedCount) * 100)
      : 0;

    const wonValueINR = wonClients.reduce((sum, c) => sum + convertToINR(c.value, c.country), 0);
    const avgWonDealSizeINR = wonCount > 0 ? wonValueINR / wonCount : 0;
    
    const avgDealSizeINR = totalClients > 0 ? totalPipelineINR / totalClients : 0;

    const now = new Date();
    const daysInPipeline = activeClients.map(c => {
      const startDate = c.pipelineStartDate ? new Date(c.pipelineStartDate) : new Date(c.createdAt);
      return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    });
    const avgCycleTime = daysInPipeline.length > 0
      ? Math.round(daysInPipeline.reduce((a, b) => a + b, 0) / daysInPipeline.length)
      : 0;

    const stageData = Object.entries(
      activeClients.reduce((acc, c) => {
        if (!acc[c.stage]) acc[c.stage] = { stage: c.stage, count: 0, value: 0 };
        acc[c.stage].count++;
        acc[c.stage].value += convertToINR(c.value, c.country);
        return acc;
      }, {} as Record<string, { stage: string; count: number; value: number }>)
    ).map(([_, data]) => data).sort((a, b) => {
      const stageOrder = ['Lead', 'Qualified', 'Meeting Scheduled', 'Demo Completed', 
        'Proof of Concept (POC)', 'Proposal Sent', 'Verbal Commitment', 'Contract Review'];
      return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
    });

    const priorityData = Object.entries(
      activeClients.reduce((acc, c) => {
        if (!acc[c.priority]) acc[c.priority] = { name: c.priority, value: 0, amount: 0 };
        acc[c.priority].value++;
        acc[c.priority].amount += convertToINR(c.value, c.country);
        return acc;
      }, {} as Record<string, { name: string; value: number; amount: number }>)
    ).map(([_, data]) => ({ ...data, fill: PRIORITY_COLORS[data.name] || '#6b7280' })).sort((a, b) => {
      const order = ['High', 'Medium', 'Low'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });

    const countryData = Object.entries(
      clients.reduce((acc, c) => {
        if (!acc[c.country]) acc[c.country] = { country: c.country, deals: 0, value: 0 };
        acc[c.country].deals++;
        acc[c.country].value += convertToINR(c.value, c.country);
        return acc;
      }, {} as Record<string, { country: string; deals: number; value: number }>)
    ).map(([_, data]) => data).sort((a, b) => b.value - a.value);

    const personData = Object.entries(
      clients.reduce((acc, c) => {
        const person = c.responsiblePerson || 'Unassigned';
        if (!acc[person]) acc[person] = { name: person, deals: 0, value: 0, won: 0 };
        acc[person].deals++;
        acc[person].value += convertToINR(c.value, c.country);
        if (c.stage === 'Won') acc[person].won++;
        return acc;
      }, {} as Record<string, { name: string; deals: number; value: number; won: number }>)
    ).map(([_, data]) => data).sort((a, b) => b.value - a.value);

    const daysRanges = [
      { range: '0-7 days', min: 0, max: 7, count: 0 },
      { range: '8-14 days', min: 8, max: 14, count: 0 },
      { range: '15-21 days', min: 15, max: 21, count: 0 },
      { range: '22-30 days', min: 22, max: 30, count: 0 },
      { range: '30+ days', min: 31, max: Infinity, count: 0 },
    ];
    daysInPipeline.forEach(days => {
      const range = daysRanges.find(r => days >= r.min && days <= r.max);
      if (range) range.count++;
    });

    const scatterData = activeClients.map(c => {
      const startDate = c.pipelineStartDate ? new Date(c.pipelineStartDate) : new Date(c.createdAt);
      const days = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return {
        name: c.companyName,
        days,
        value: convertToINR(c.value, c.country),
        priority: c.priority,
      };
    });

    const activePipelineStages = [
      'Lead', 'Qualified', 'Meeting Scheduled', 'Demo Completed',
      'Proof of Concept (POC)', 'Proposal Sent', 'Verbal Commitment',
      'Contract Review'
    ];
    const funnelData = activePipelineStages.map(stage => ({
      name: stage,
      value: activeClients.filter(c => c.stage === stage).length,
      fill: STAGE_COLORS[stage] || '#6b7280',
    })).filter(d => d.value > 0);

    const highPriorityNeedingAttention = activeClients.filter(c => {
      if (c.priority !== 'High') return false;
      const nextFollowUp = new Date(c.nextFollowUp);
      const daysDiff = Math.floor((nextFollowUp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 2;
    });

    const stalledDeals = activeClients.filter(c => {
      const startDate = c.pipelineStartDate ? new Date(c.pipelineStartDate) : new Date(c.createdAt);
      const days = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 21 && c.status === 'In Negotiation';
    });

    const leadsReadyForQualification = clients.filter(c => {
      const startDate = c.pipelineStartDate ? new Date(c.pipelineStartDate) : new Date(c.createdAt);
      const days = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return c.stage === 'Lead' && days >= 7;
    });

    // Service Analytics Data
    const serviceData = Object.entries(
      clients.reduce((acc, c) => {
        const service = c.service || 'Unspecified';
        if (!acc[service]) {
          acc[service] = { 
            name: service, 
            deals: 0, 
            activeDeals: 0,
            value: 0, 
            won: 0, 
            lost: 0,
            totalCycleDays: 0,
            closedDealsCount: 0
          };
        }
        acc[service].deals++;
        acc[service].value += convertToINR(c.value, c.country);
        if (c.stage === 'Won') {
          acc[service].won++;
          acc[service].closedDealsCount++;
          const startDate = c.pipelineStartDate ? new Date(c.pipelineStartDate) : new Date(c.createdAt);
          acc[service].totalCycleDays += Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        if (c.stage === 'Lost') {
          acc[service].lost++;
          acc[service].closedDealsCount++;
        }
        if (c.stage !== 'Won' && c.stage !== 'Lost') {
          acc[service].activeDeals++;
          const startDate = c.pipelineStartDate ? new Date(c.pipelineStartDate) : new Date(c.createdAt);
          acc[service].totalCycleDays += Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        }
        return acc;
      }, {} as Record<string, { 
        name: string; 
        deals: number; 
        activeDeals: number;
        value: number; 
        won: number; 
        lost: number;
        totalCycleDays: number;
        closedDealsCount: number;
      }>)
    ).map(([_, data]) => ({
      ...data,
      avgDealSize: data.deals > 0 ? data.value / data.deals : 0,
      winRate: data.closedDealsCount > 0 ? (data.won / data.closedDealsCount) * 100 : 0,
      avgCycleTime: data.activeDeals > 0 ? Math.round(data.totalCycleDays / data.activeDeals) : 0,
      fill: SERVICE_COLORS[data.name] || '#6b7280',
    })).filter(s => s.name !== 'Unspecified' && s.deals > 0).sort((a, b) => b.value - a.value);

    // Service revenue comparison for horizontal bar chart
    const serviceRevenueData = serviceData.map(s => ({
      name: s.name,
      value: s.value,
      fill: s.fill,
    })).sort((a, b) => b.value - a.value);

    // Service portfolio mix - by value and by count
    const serviceByValue = serviceData.map(s => ({
      name: s.name,
      value: s.value,
      fill: s.fill,
    }));
    const serviceByCount = serviceData.map(s => ({
      name: s.name,
      value: s.deals,
      fill: s.fill,
    }));

    // Service insights
    const highestRevenueService = serviceData.length > 0 ? serviceData[0] : null;
    const bestWinRateService = serviceData.length > 0 
      ? [...serviceData].filter(s => s.closedDealsCount >= 1).sort((a, b) => b.winRate - a.winRate)[0] || null 
      : null;
    const largestAvgDealService = serviceData.length > 0 
      ? [...serviceData].sort((a, b) => b.avgDealSize - a.avgDealSize)[0] 
      : null;

    return {
      totalClients,
      wonCount,
      lostCount,
      closedCount,
      inNegotiationCount: inNegotiationClients.length,
      activeCount: activeClients.length,
      totalPipelineINR,
      activePipelineINR,
      wonValueINR,
      winRate,
      avgDealSizeINR,
      avgWonDealSizeINR,
      avgCycleTime,
      stageData,
      priorityData,
      countryData,
      personData,
      daysRanges,
      scatterData,
      funnelData,
      highPriorityNeedingAttention,
      stalledDeals,
      leadsReadyForQualification,
      serviceData,
      serviceRevenueData,
      serviceByValue,
      serviceByCount,
      highestRevenueService,
      bestWinRateService,
      largestAvgDealService,
    };
  }, [clients]);

  const formatValue = (value: number) => {
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)} L`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  const views: { id: ViewType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'pipeline', label: 'Pipeline', icon: Target },
    { id: 'performance', label: 'Performance', icon: Users },
    { id: 'geographic', label: 'Geographic', icon: Globe },
    { id: 'services', label: 'Services', icon: Briefcase },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="px-4 py-3">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium mb-2">Failed to load analytics</p>
              <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-2xl font-semibold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Strategic insights for client relationship management
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {views.map((view) => (
            <Button
              key={view.id}
              variant={selectedView === view.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedView(view.id)}
              className="gap-2 whitespace-nowrap"
              data-testid={`button-view-${view.id}`}
            >
              <view.icon className="h-4 w-4" />
              {view.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            title="Active Pipeline (INR)"
            value={`₹${formatValue(analytics.activePipelineINR)}`}
            subtitle={`${analytics.activeCount} active deals`}
            icon={DollarSign}
            trend="up"
          />
          <KPICard
            title="Win Rate"
            value={`${analytics.winRate.toFixed(1)}%`}
            subtitle={`${analytics.wonCount} won / ${analytics.closedCount} closed`}
            icon={Award}
            trend={analytics.winRate >= 50 ? 'up' : 'down'}
          />
          <KPICard
            title="Avg Won Deal (INR)"
            value={analytics.wonCount > 0 ? `₹${formatValue(analytics.avgWonDealSizeINR)}` : 'N/A'}
            subtitle={analytics.wonCount > 0 ? `From ${analytics.wonCount} won deal${analytics.wonCount !== 1 ? 's' : ''}` : 'No won deals yet'}
            icon={Target}
            trend={analytics.wonCount > 0 ? 'up' : 'neutral'}
          />
          <KPICard
            title="Avg Cycle Time"
            value={`${analytics.avgCycleTime} days`}
            subtitle="In active pipeline"
            icon={Calendar}
            trend={analytics.avgCycleTime <= 14 ? 'up' : 'down'}
          />
        </div>

        {selectedView === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pipeline by Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.stageData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: number, name: string) =>
                          name === 'Value (INR)' ? formatINR(value) : value
                        }
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar yAxisId="right" dataKey="count" fill={CHART_COLORS.purple} name="Deal Count" />
                      <Bar yAxisId="left" dataKey="value" fill={CHART_COLORS.blue} name="Value (INR)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Cycle Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={analytics.daysRanges}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="count" fill={CHART_COLORS.amber} name="Deals" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Priority Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={analytics.priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {analytics.priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Action Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start p-3 bg-red-50 dark:bg-red-900/20 rounded-lg gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">High Priority Follow-ups</p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        {analytics.highPriorityNeedingAttention.length} deal{analytics.highPriorityNeedingAttention.length !== 1 ? 's' : ''} need attention within 2 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Stalled Negotiations</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        {analytics.stalledDeals.length} deal{analytics.stalledDeals.length !== 1 ? 's' : ''} in negotiation over 21 days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Conversion Opportunity</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {analytics.leadsReadyForQualification.length} lead{analytics.leadsReadyForQualification.length !== 1 ? 's' : ''} ready for qualification (7+ days)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {selectedView === 'pipeline' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sales Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={analytics.funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="value" name="Deals">
                        {analytics.funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col justify-center space-y-3">
                    <h4 className="font-semibold text-foreground">Stage Summary</h4>
                    <div className="space-y-2">
                      {analytics.funnelData.map((stage, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stage.fill }} />
                            <span className="text-sm text-muted-foreground truncate">{stage.name}</span>
                          </div>
                          <Badge variant="secondary">{stage.value}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Deal Health Analysis</CardTitle>
                <p className="text-xs text-muted-foreground">Days in pipeline vs Deal value (INR)</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" dataKey="days" name="Days in Pipeline" tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="value" name="Deal Value (INR)" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${formatValue(v)}`} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: number, name: string) =>
                        name === 'Deal Value (INR)' ? formatINR(value) : value
                      }
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Scatter name="Deals" data={analytics.scatterData} fill={CHART_COLORS.blue} />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedView === 'performance' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={analytics.personData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${formatValue(v)}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === 'Pipeline Value (INR)' ? formatINR(value) : value
                      }
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="value" fill={CHART_COLORS.blue} name="Pipeline Value (INR)" />
                    <Bar yAxisId="right" dataKey="deals" fill={CHART_COLORS.green} name="Active Deals" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.personData.map((person, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <h4 className="font-semibold text-foreground truncate">{person.name}</h4>
                      <Users className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Active Deals</p>
                        <p className="text-xl font-bold text-foreground">{person.deals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Won Deals</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{person.won}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pipeline Value</p>
                        <p className="text-lg font-semibold text-foreground">₹{formatValue(person.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                        <p className="text-lg font-semibold text-foreground">
                          ₹{formatValue(person.deals > 0 ? person.value / person.deals : 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'geographic' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={analytics.countryData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="country" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${formatValue(v)}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === 'Pipeline Value (INR)' ? formatINR(value) : value
                      }
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="value" fill={CHART_COLORS.blue} name="Pipeline Value (INR)" />
                    <Bar yAxisId="right" dataKey="deals" fill={CHART_COLORS.green} name="Deal Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.countryData.map((country, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <h4 className="font-semibold text-foreground truncate">{country.country}</h4>
                      <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Deals</p>
                        <p className="text-lg font-bold text-foreground">{country.deals}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Value (INR)</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{formatValue(country.value)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedView === 'services' && (
          <div className="space-y-4">
            {/* Service Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {analytics.highestRevenueService && (
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Highest Revenue</p>
                        <h4 className="font-bold text-lg text-foreground truncate">{analytics.highestRevenueService.name}</h4>
                        <p className="text-sm text-muted-foreground">₹{formatValue(analytics.highestRevenueService.value)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              )}
              {analytics.bestWinRateService && (
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Best Win Rate</p>
                        <h4 className="font-bold text-lg text-foreground truncate">{analytics.bestWinRateService.name}</h4>
                        <p className="text-sm text-muted-foreground">{analytics.bestWinRateService.winRate.toFixed(1)}%</p>
                      </div>
                      <Trophy className="w-8 h-8 text-green-500 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              )}
              {analytics.largestAvgDealService && (
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Largest Avg Deal</p>
                        <h4 className="font-bold text-lg text-foreground truncate">{analytics.largestAvgDealService.name}</h4>
                        <p className="text-sm text-muted-foreground">₹{formatValue(analytics.largestAvgDealService.avgDealSize)}</p>
                      </div>
                      <Star className="w-8 h-8 text-amber-500 shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Service Revenue Comparison */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Service Line Revenue Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.serviceRevenueData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${formatValue(v)}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                    <Tooltip 
                      formatter={(value: number) => formatINR(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" name="Pipeline Value (INR)">
                      {analytics.serviceRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Portfolio Mix - Two Pie Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Portfolio by Pipeline Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={analytics.serviceByValue}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      >
                        {analytics.serviceByValue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatINR(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Portfolio by Deal Count</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={analytics.serviceByCount}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      >
                        {analytics.serviceByCount.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Service Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {analytics.serviceData.map((service, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: service.fill }} />
                        <h4 className="font-semibold text-foreground truncate">{service.name}</h4>
                      </div>
                      <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Active Deals</p>
                        <p className="text-lg font-bold text-foreground">{service.activeDeals}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pipeline Value</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹{formatValue(service.value)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Deal Size</p>
                        <p className="text-sm font-semibold text-foreground">₹{formatValue(service.avgDealSize)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Cycle Time</p>
                        <p className="text-sm font-semibold text-foreground">{service.avgCycleTime} days</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Won Deals</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{service.won}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="text-sm font-semibold text-foreground">{service.winRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Service Performance Metrics Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Service Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-semibold text-foreground">Service</th>
                        <th className="text-right py-3 px-2 font-semibold text-foreground">Deals</th>
                        <th className="text-right py-3 px-2 font-semibold text-foreground">Pipeline Value</th>
                        <th className="text-right py-3 px-2 font-semibold text-foreground">Avg Deal Size</th>
                        <th className="text-right py-3 px-2 font-semibold text-foreground">Won</th>
                        <th className="text-right py-3 px-2 font-semibold text-foreground">Win Rate</th>
                        <th className="text-right py-3 px-2 font-semibold text-foreground">Avg Cycle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.serviceData.map((service, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: service.fill }} />
                              <span className="text-foreground font-medium">{service.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 text-foreground">{service.deals}</td>
                          <td className="text-right py-3 px-2 text-blue-600 dark:text-blue-400 font-medium">₹{formatValue(service.value)}</td>
                          <td className="text-right py-3 px-2 text-foreground">₹{formatValue(service.avgDealSize)}</td>
                          <td className="text-right py-3 px-2 text-green-600 dark:text-green-400 font-medium">{service.won}</td>
                          <td className="text-right py-3 px-2 text-foreground">{service.winRate.toFixed(1)}%</td>
                          <td className="text-right py-3 px-2 text-foreground">{service.avgCycleTime} days</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {analytics.serviceData.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium mb-2">No Service Data Available</p>
                  <p className="text-sm text-muted-foreground">Add services to your clients to see analytics here</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
