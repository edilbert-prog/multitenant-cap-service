import { useDashboardStats } from '@/api/validation/hooks';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Cable, CheckCircle, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import ValidationLayout from './ValidationLayout';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: loading, error } = useDashboardStats();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <ValidationLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ValidationLayout>
    );
  }

  if (error) {
    return (
      <ValidationLayout>
        <Alert variant="destructive">
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load dashboard statistics'}
          </AlertDescription>
        </Alert>
      </ValidationLayout>
    );
  }

  return (
    <ValidationLayout>
      <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your data validation workflow system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Connections</p>
              <p className="text-3xl font-bold">{stats?.total_connections || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cable className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats?.active_connections || 0} active connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
              <p className="text-3xl font-bold">{stats?.total_validations || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-[hsl(var(--color-info))]/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-[hsl(var(--color-info))]" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats?.active_validations || 0} active workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold">{stats?.success_rate?.toFixed(1) || 0}%</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-[hsl(var(--color-success))]/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-[hsl(var(--color-success))]" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Recent Results</p>
              <p className="text-3xl font-bold">{stats?.recent_results?.length || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-[hsl(var(--color-warning))]/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-[hsl(var(--color-warning))]" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Last 10 executions</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results Table */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Recent Workflow Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Execution Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Matched</TableHead>
                  <TableHead className="text-right">Left Only</TableHead>
                  <TableHead className="text-right">Right Only</TableHead>
                  <TableHead className="text-right">Match %</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recent_results && stats.recent_results.length > 0 ? (
                  stats.recent_results.map((result) => (
                    <TableRow
                      key={result.result_id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/validation/results/${result.result_id}`)}
                    >
                      <TableCell className="font-medium">#{result.validation_id}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(result.execution_timestamp)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(result.execution_status) as any}>
                          {result.execution_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{result.matched}</TableCell>
                      <TableCell className="text-right">{result.left_only}</TableCell>
                      <TableCell className="text-right">{result.right_only}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">{result.match_percentage.toFixed(2)}%</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{result.execution_time_ms}ms</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No recent results available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </ValidationLayout>
  );
}
