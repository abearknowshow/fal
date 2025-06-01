import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');
    const productType = searchParams.get('productType') || 'video';
    const timeStart = searchParams.get('timeStart');
    const timeEnd = searchParams.get('timeEnd');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('Fetching usage analytics (NEW SYSTEM):', {
      apiKey: apiKey ? apiKey.substring(0, 10) + '...' : 'all',
      productType,
      timeStart,
      timeEnd,
      limit,
      timestamp: new Date().toISOString()
    });

    // This would connect to your analytics storage in a real implementation
    // For now, providing structure for the new system compliance
    const mockUsageData = {
      summary: {
        totalCalls: 127,
        totalUnitsDeduced: 254,
        totalCost: '$30.48',
        period: {
          start: timeStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: timeEnd || new Date().toISOString()
        },
        realTimeUpdates: true, // NEW SYSTEM feature
        instantDataDisplay: true // NEW SYSTEM feature
      },
      breakdown: {
        byModel: {
          'kling-v1': {
            calls: 89,
            unitsDeduced: 178,
            cost: '$21.36',
            averageProcessingTime: '45s'
          },
          'kling-v1.5': {
            calls: 38,
            unitsDeduced: 76,
            cost: '$9.12',
            averageProcessingTime: '52s'
          }
        },
        byDuration: {
          '5s': {
            calls: 95,
            unitsDeduced: 95,
            cost: '$11.40'
          },
          '10s': {
            calls: 32,
            unitsDeduced: 159,
            cost: '$19.08'
          }
        },
        byDay: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          calls: Math.floor(Math.random() * 20) + 5,
          unitsDeduced: Math.floor(Math.random() * 40) + 10,
          cost: `$${(Math.random() * 5 + 1).toFixed(2)}`
        })).reverse()
      },
      recent: Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
        id: `task_${Date.now() - i * 60000}`,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        model: Math.random() > 0.5 ? 'kling-v1' : 'kling-v1.5',
        duration: Math.random() > 0.5 ? 5 : 10,
        status: ['completed', 'completed', 'completed', 'failed'][Math.floor(Math.random() * 4)],
        unitsDeduced: Math.random() > 0.5 ? 1 : 2,
        cost: Math.random() > 0.5 ? '$0.12' : '$0.24',
        processingTime: `${Math.floor(Math.random() * 60) + 30}s`
      })),
      system: {
        endpoint: 'api-singapore.klingai.com',
        realTimeUpdates: true,
        dataDelay: 'instant', // NEW: upgraded from 12-hour delay
        lastUpdated: new Date().toISOString(),
        features: [
          'real-time-data-updates',
          'flexible-filtering-querying',
          'api-key-filtering',
          'product-type-filtering',
          'time-period-filtering'
        ]
      }
    };

    return NextResponse.json({
      success: true,
      data: mockUsageData,
      meta: {
        apiVersion: 'new-system',
        generatedAt: new Date().toISOString(),
        realTimeData: true
      }
    });

  } catch (error) {
    console.error('Usage analytics error (NEW SYSTEM):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch usage analytics',
        errorCode: 'ANALYTICS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { event, data } = await request.json();

    // Track usage events in real-time (NEW SYSTEM feature)
    console.log('Recording usage event (NEW SYSTEM):', {
      event,
      data,
      timestamp: new Date().toISOString(),
      realTimeTracking: true
    });

    // In a real implementation, this would store the event in your analytics system
    const eventRecord = {
      id: `event_${Date.now()}`,
      event,
      data,
      timestamp: new Date().toISOString(),
      processed: true,
      realTime: true // NEW SYSTEM feature
    };

    return NextResponse.json({
      success: true,
      eventRecord,
      meta: {
        realTimeProcessing: true,
        instantDataUpdates: true,
        apiVersion: 'new-system'
      }
    });

  } catch (error) {
    console.error('Usage event recording error (NEW SYSTEM):', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        error: 'Failed to record usage event',
        errorCode: 'EVENT_RECORDING_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 