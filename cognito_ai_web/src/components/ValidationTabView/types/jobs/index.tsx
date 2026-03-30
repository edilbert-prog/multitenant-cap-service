export interface FlowJob {
  id: number;
  deployment_name: string;
  deployment_id: string;
  flow_name: string;
  flow_id: string;
  flow_run_name: string;
  flow_run_id: string;
  job_status: string;
  statement_date: string;
  created_at: string;
  updated_at: string;
  executed_by: string;
  error_msg: string;
}

export interface Task {
  id: number;
  task_name: string;
  task_id: string;
  flow_run_name: string;
  flow_run_id: string;
  flow_name: string;
  flow_id: string;
  start_time: string;
  end_time: string;
  duration: number;
  task_state: string;
  created_at: string;
  updated_at: string;
  error_msg: string;
  input_records_count: number;
  output_records_count: number;
  workflow_type: string;
  execution_number: string;
  task_key: string;
}

export interface ApiResponse<T> {
  data: T[];
  total: number;
  count: number;
}

export interface StatusChartData {
  status: 'Completed' | 'Failed' | 'Running' | 'Pending' | 'Other';
  count: number;
  date?: string;
}

export interface TasksChartData {
  date: string;
  Completed: number;
  Failed: number;
}

export type TimeRange = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days';

export interface DateRange {
  from: Date;
  to?: Date;
}

export interface JobsFilter {
  timeRange?: TimeRange;
  dateRange?: DateRange;
  deploymentName?: string;
  taskName?: string;
  status?: string;
  searchText?: string;
}
