'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, TrendingUp, Clock, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { UsageAnalyticsResponse } from '@/types/video-generation';

export function UsageAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<UsageAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    productType: 'video',
    timeStart: '',
    timeEnd: '',
    limit: '50'
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.productType) params.append('productType', filters.productType);
      if (filters.timeStart) params.append('timeStart', filters.timeStart);
      if (filters.timeEnd) params.append('timeEnd', filters.timeEnd);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await fetch(`/api/usage-analytics?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data);
      } else {
        console.error('Failed to fetch analytics:', data.error);
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (!analyticsData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Loading Usage Analytics...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const { data } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kling AI Usage Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Real-time usage data • NEW SYSTEM • {data.system.endpoint}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            {data.system.realTimeUpdates ? 'Real-time' : 'Delayed'}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {data.system.dataDelay}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Querying</CardTitle>
          <CardDescription>
            Flexible filtering by product type, time period, and other criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="productType">Product Type</Label>
              <Select 
                value={filters.productType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, productType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Generation</SelectItem>
                  <SelectItem value="image">Image Generation</SelectItem>
                  <SelectItem value="all">All Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timeStart">Start Date</Label>
              <Input
                type="datetime-local"
                value={filters.timeStart}
                onChange={(e) => setFilters(prev => ({ ...prev, timeStart: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="timeEnd">End Date</Label>
              <Input
                type="datetime-local"
                value={filters.timeEnd}
                onChange={(e) => setFilters(prev => ({ ...prev, timeEnd: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="limit">Results Limit</Label>
              <Input
                type="number"
                value={filters.limit}
                onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value }))}
                min="1"
                max="100"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchAnalytics} disabled={loading}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total API Calls</p>
                <p className="text-2xl font-bold">{data.summary.totalCalls}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Units Deduced</p>
                <p className="text-2xl font-bold">{data.summary.totalUnitsDeduced}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Total Cost</p>
                <p className="text-2xl font-bold">{data.summary.totalCost}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Data Updates</p>
                <p className="text-sm font-bold text-green-600">
                  {data.summary.instantDataDisplay ? 'Instant' : 'Delayed'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.breakdown.byModel).map(([model, stats]) => (
              <div key={model} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{model}</p>
                  <p className="text-sm text-muted-foreground">
                    Avg. processing: {stats.averageProcessingTime}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm"><span className="font-medium">{stats.calls}</span> calls</p>
                  <p className="text-sm"><span className="font-medium">{stats.unitsDeduced}</span> units</p>
                  <p className="text-sm font-medium text-green-600">{stats.cost}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>
            Real-time usage data with instant updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-sm font-medium">{item.model}</span>
                  <span className="text-sm text-muted-foreground">{item.duration}s</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.cost}</p>
                  <p className="text-xs text-muted-foreground">{item.processingTime}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">API Endpoint</p>
              <p className="text-sm text-muted-foreground">{data.system.endpoint}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Data Delay</p>
              <p className="text-sm text-muted-foreground">{data.system.dataDelay}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {new Date(data.system.lastUpdated).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Features</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {data.system.features.map((feature) => (
                  <span key={feature} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {feature.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 