import { useMemo, useState, useEffect, memo, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, Database, Filter as FilterIcon, Map as MapIcon, Search, GitMerge, GitCompare, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStepData } from '@/api/validation/hooks';

interface PipelineMetric {
  step: string;
  operation: string;
  description: string;
  row_count: number;
  datasource_name?: string;
  file_name?: string;
}

interface ComparisonMetric {
  step: string;
  operation: string;
  description: string;
  key_fields: string[];
  compare_fields: string[];
  left_row_count: number;
  right_row_count: number;
  fully_matched: number;
  differences: number;
  left_only: number;
  right_only: number;
}

interface PipelineFlowDiagramProps {
  leftMetrics?: PipelineMetric[];
  rightMetrics?: PipelineMetric[];
  comparison?: ComparisonMetric;
  resultId: number;
}

// Custom node component for pipeline steps
const PipelineNode = ({ data }: { data: any }) => {
  const getIcon = () => {
    switch (data.operation) {
      case 'SOURCE':
        return <Database className="h-5 w-5" />;
      case 'JOIN':
        return <GitMerge className="h-5 w-5" />;
      case 'FILTER':
        return <Filter className="h-5 w-5" />;
      case 'MAP':
        return <MapIcon className="h-5 w-5" />;
      case 'LOOKUP':
        return <Search className="h-5 w-5" />;
      default:
        return <ArrowRight className="h-5 w-5" />;
    }
  };

  const getOperationColor = () => {
    const isLeftPipeline = data.pipeline === 'Left';

    switch (data.operation) {
      case 'SOURCE':
        return isLeftPipeline
          ? 'bg-blue-100 border-blue-300 text-blue-800'
          : 'bg-green-100 border-green-300 text-green-800';
      case 'JOIN':
        return isLeftPipeline
          ? 'bg-purple-100 border-purple-300 text-purple-800'
          : 'bg-teal-100 border-teal-300 text-teal-800';
      case 'FILTER':
        return isLeftPipeline
          ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
          : 'bg-lime-100 border-lime-300 text-lime-800';
      case 'MAP':
        return isLeftPipeline
          ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
          : 'bg-emerald-100 border-emerald-300 text-emerald-800';
      case 'LOOKUP':
        return isLeftPipeline
          ? 'bg-orange-100 border-orange-300 text-orange-800'
          : 'bg-cyan-100 border-cyan-300 text-cyan-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // Calculate percentage change from previous step
  const getRowCountBadgeVariant = () => {
    if (data.percentChange === undefined) return 'default';
    if (data.percentChange < -50) return 'destructive';
    if (data.percentChange < -20) return 'secondary';
    return 'default';
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Card className={`w-[300px] border-2 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${getOperationColor()}`} title="Double-click to view data">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-sm">{data.step}</span>
                  {data.datasource_name && data.operation === 'SOURCE' && (
                    <span className="text-xs text-muted-foreground">
                      {data.datasource_name}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs font-mono shrink-0">
                  {data.operation}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                {data.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Rows:</span>
                <Badge variant={getRowCountBadgeVariant()} className="font-mono text-sm">
                  {data.row_count.toLocaleString()}
                </Badge>
              </div>
              {data.percentChange !== undefined && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {data.percentChange > 0 ? '+' : ''}
                  {data.percentChange.toFixed(1)}% from previous
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

// Custom node component for comparison step
const ComparisonNode = ({ data }: { data: any }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} id="left-input" style={{ left: '33%' }} />
      <Handle type="target" position={Position.Top} id="right-input" style={{ left: '67%' }} />
      <Card className="w-[450px] border-4 border-indigo-400 shadow-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <GitCompare className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="font-bold text-base text-indigo-900">Data Comparison</span>
                <Badge variant="outline" className="text-xs font-mono border-indigo-300 text-indigo-700">
                  COMPARE
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Match Keys */}
                <div className="bg-white/60 rounded p-2">
                  <p className="text-xs font-semibold mb-1 text-indigo-900">Match Keys:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.key_fields?.map((field: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 rounded p-2 border border-green-200">
                    <p className="text-xs text-green-700 font-medium">Fully Matched</p>
                    <p className="text-lg font-bold text-green-800">{data.fully_matched?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-red-50 rounded p-2 border border-red-200">
                    <p className="text-xs text-red-700 font-medium">Differences</p>
                    <p className="text-lg font-bold text-red-800">{data.differences?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-blue-50 rounded p-2 border border-blue-200">
                    <p className="text-xs text-blue-700 font-medium">Left Only</p>
                    <p className="text-lg font-bold text-blue-800">{data.left_only?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded p-2 border border-purple-200">
                    <p className="text-xs text-purple-700 font-medium">Right Only</p>
                    <p className="text-lg font-bold text-purple-800">{data.right_only?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Register custom node types
const nodeTypes = {
  pipelineStep: PipelineNode,
  comparisonStep: ComparisonNode,
};

// Memoized table header component - only re-renders when columns change, not when data changes
const TableHeaderWithFilters = memo(({
  columns,
  inputValues,
  onFilterChange
}: {
  columns: string[];
  inputValues: Record<string, string>;
  onFilterChange: (col: string, value: string) => void;
}) => {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((col) => (
          <TableHead key={col} className="whitespace-nowrap">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">{col}</span>
              <Input
                placeholder={`Filter ${col}...`}
                value={inputValues[col] || ''}
                onChange={(e) => onFilterChange(col, e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
});

TableHeaderWithFilters.displayName = 'TableHeaderWithFilters';

export default function PipelineFlowDiagram({ leftMetrics, rightMetrics, comparison, resultId }: PipelineFlowDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<{ step: string; operation: string; pipeline: string; rowCount: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Local state for input values (updates immediately, no API calls)
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Debounced state for actual filters (triggers API calls)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Track if filter is pending (debouncing)
  const isFilterPending = useMemo(() => {
    return JSON.stringify(inputValues) !== JSON.stringify(columnFilters);
  }, [inputValues, columnFilters]);

  // Debounce: Update columnFilters 500ms after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setColumnFilters(inputValues);
      setPage(1); // Reset to first page when filters change
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputValues]);

  // Convert columnFilters to API format
  const filters = useMemo(() => {
    return Object.entries(columnFilters)
      .filter(([_, value]) => value.trim() !== '')
      .map(([column, value]) => ({ column, value }));
  }, [columnFilters]);

  // Fetch step data from backend with filters
  const { data: stepData, isLoading: stepDataLoading } = useStepData(
    resultId,
    selectedNode?.pipeline.toLowerCase() as 'left' | 'right',
    selectedNode?.step || '',
    page,
    pageSize,
    filters,
    isModalOpen && !!selectedNode
  );

  // Convert metrics to React Flow nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const VERTICAL_SPACING = 200;
    const HORIZONTAL_SPACING = 900; // Increased for wider pipelines
    const START_Y = 50;

    // Helper function to extract source dependencies from description
    const extractSourceDependencies = (description: string, operation: string): string[] => {
      if (operation === 'JOIN') {
        // Parse "JOIN: source_1 INNER source_2 ON ..." or "JOIN: result INNER source_3 ON ..."
        const match = description.match(/JOIN:\s+(\S+)\s+\w+\s+(\S+)\s+ON/i);
        if (match) {
          return [match[1], match[2]];
        }
      }
      return [];
    };

    // Helper function to calculate dependency levels (topological sort)
    const calculateNodeLevels = (metrics: PipelineMetric[]): Map<string, number> => {
      const levels = new Map<string, number>();
      const dependencies = new Map<string, string[]>();

      // Build dependency graph
      metrics.forEach((metric) => {
        if (metric.operation === 'SOURCE') {
          levels.set(metric.step, 0);
          dependencies.set(metric.step, []);
        } else if (metric.operation === 'JOIN') {
          const deps = extractSourceDependencies(metric.description, metric.operation);
          dependencies.set(metric.step, deps);
        } else {
          // FILTER/MAP/LOOKUP depend on previous step
          const prevMetric = metrics[metrics.indexOf(metric) - 1];
          if (prevMetric) {
            dependencies.set(metric.step, [prevMetric.step]);
          }
        }
      });

      // Calculate levels using topological sort
      const calculateLevel = (step: string): number => {
        if (levels.has(step)) {
          return levels.get(step)!;
        }

        const deps = dependencies.get(step) || [];
        if (deps.length === 0) {
          levels.set(step, 0);
          return 0;
        }

        const maxDepLevel = Math.max(...deps.map(dep => calculateLevel(dep)));
        const level = maxDepLevel + 1;
        levels.set(step, level);
        return level;
      };

      metrics.forEach(metric => calculateLevel(metric.step));
      return levels;
    };

    // Helper function to create nodes and edges from metrics
    const createNodesAndEdges = (
      metrics: PipelineMetric[],
      startX: number,
      pipelineLabel: 'Left' | 'Right'
    ) => {
      // Create a map of step names to node IDs
      const stepToNodeId = new Map<string, string>();

      // Calculate dependency levels for each node
      const nodeLevels = calculateNodeLevels(metrics);

      // Group nodes by level
      const levelGroups = new Map<number, PipelineMetric[]>();
      metrics.forEach((metric) => {
        const level = nodeLevels.get(metric.step) || 0;
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(metric);
      });

      metrics.forEach((metric, index) => {
        const nodeId = `${pipelineLabel.toLowerCase()}-${index}`;
        stepToNodeId.set(metric.step, nodeId);

        // Calculate percentage change from previous step
        let percentChange: number | undefined;
        if (index > 0) {
          const prevCount = metrics[index - 1].row_count;
          const currentCount = metric.row_count;
          percentChange = ((currentCount - prevCount) / prevCount) * 100;
        }

        // Calculate position based on level and position within level
        const level = nodeLevels.get(metric.step) || 0;
        const nodesInLevel = levelGroups.get(level) || [];
        const positionInLevel = nodesInLevel.indexOf(metric);

        // Dynamic spacing calculation
        const NODE_WIDTH = 300; // Fixed card width (w-[300px])
        const MIN_PADDING = 120; // Minimum padding between nodes for better readability
        const HORIZONTAL_NODE_SPACING = NODE_WIDTH + MIN_PADDING;

        // Calculate total width needed for this level
        const levelWidth = nodesInLevel.length * HORIZONTAL_NODE_SPACING;

        // Center the group and position each node
        const xOffset = (positionInLevel - (nodesInLevel.length - 1) / 2) * HORIZONTAL_NODE_SPACING;

        // Create node
        nodes.push({
          id: nodeId,
          type: 'pipelineStep',
          position: {
            x: startX + xOffset,
            y: START_Y + level * VERTICAL_SPACING
          },
          data: {
            ...metric,
            percentChange,
            pipeline: pipelineLabel,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });

      // Create edges based on operation dependencies
      metrics.forEach((metric, index) => {
        const nodeId = `${pipelineLabel.toLowerCase()}-${index}`;

        if (metric.operation === 'JOIN') {
          // JOIN operations: connect both source dependencies
          const dependencies = extractSourceDependencies(metric.description, metric.operation);

          dependencies.forEach((dep) => {
            const sourceNodeId = stepToNodeId.get(dep);
            if (sourceNodeId) {
              edges.push({
                id: `${sourceNodeId}-to-${nodeId}`,
                source: sourceNodeId,
                target: nodeId,
                type: 'smoothstep',
                animated: true,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 25,
                  height: 25,
                  color: pipelineLabel === 'Left' ? '#3b82f6' : '#10b981',
                },
                style: {
                  strokeWidth: 3,
                  stroke: pipelineLabel === 'Left' ? '#3b82f6' : '#10b981',
                },
                label: `${metric.row_count.toLocaleString()} rows`,
                labelStyle: {
                  fontSize: 13,
                  fontWeight: 700,
                  fill: pipelineLabel === 'Left' ? '#1e40af' : '#065f46',
                },
                labelBgStyle: {
                  fill: pipelineLabel === 'Left' ? '#dbeafe' : '#d1fae5',
                  fillOpacity: 0.95
                },
              });
            }
          });
        } else if (metric.operation !== 'SOURCE' && index > 0) {
          // FILTER/MAP/LOOKUP: connect to previous step
          const prevNodeId = `${pipelineLabel.toLowerCase()}-${index - 1}`;
          edges.push({
            id: `${prevNodeId}-to-${nodeId}`,
            source: prevNodeId,
            target: nodeId,
            type: 'smoothstep',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 25,
              height: 25,
              color: pipelineLabel === 'Left' ? '#3b82f6' : '#10b981',
            },
            style: {
              strokeWidth: 3,
              stroke: pipelineLabel === 'Left' ? '#3b82f6' : '#10b981',
            },
            label: `${metric.row_count.toLocaleString()} rows`,
            labelStyle: {
              fontSize: 13,
              fontWeight: 700,
              fill: pipelineLabel === 'Left' ? '#1e40af' : '#065f46',
            },
            labelBgStyle: {
              fill: pipelineLabel === 'Left' ? '#dbeafe' : '#d1fae5',
              fillOpacity: 0.95
            },
          });
        }
      });

      return metrics.length;
    };

    // Create left pipeline
    let leftSteps = 0;
    if (leftMetrics && leftMetrics.length > 0) {
      leftSteps = createNodesAndEdges(leftMetrics, 50, 'Left');
    }

    // Create right pipeline
    let rightSteps = 0;
    if (rightMetrics && rightMetrics.length > 0) {
      rightSteps = createNodesAndEdges(rightMetrics, 50 + HORIZONTAL_SPACING, 'Right');
    }

    // Add comparison node if comparison data is available
    if (comparison) {
      // Calculate the maximum level across both pipelines
      const leftLevels = leftMetrics ? calculateNodeLevels(leftMetrics) : new Map();
      const rightLevels = rightMetrics ? calculateNodeLevels(rightMetrics) : new Map();

      const maxLeftLevel = leftLevels.size > 0 ? Math.max(...Array.from(leftLevels.values())) : 0;
      const maxRightLevel = rightLevels.size > 0 ? Math.max(...Array.from(rightLevels.values())) : 0;
      const maxLevel = Math.max(maxLeftLevel, maxRightLevel);

      const comparisonY = START_Y + (maxLevel + 1) * VERTICAL_SPACING + 50;
      const comparisonX = HORIZONTAL_SPACING / 2 - 225; // Center between pipelines (450px width / 2)

      nodes.push({
        id: 'comparison',
        type: 'comparisonStep',
        position: { x: comparisonX, y: comparisonY },
        data: comparison,
        targetPosition: Position.Top,
      });

      // Connect last left node to comparison
      if (leftSteps > 0) {
        edges.push({
          id: 'left-to-comparison',
          source: `left-${leftSteps - 1}`,
          target: 'comparison',
          targetHandle: 'left-input',
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#3b82f6',
          },
          style: {
            strokeWidth: 3,
            stroke: '#3b82f6',
          },
          label: `${comparison.left_row_count?.toLocaleString() || 0} rows`,
          labelStyle: { fontSize: 13, fontWeight: 700, fill: '#1e40af' },
          labelBgStyle: { fill: '#dbeafe', fillOpacity: 0.95 },
        });
      }

      // Connect last right node to comparison
      if (rightSteps > 0) {
        edges.push({
          id: 'right-to-comparison',
          source: `right-${rightSteps - 1}`,
          target: 'comparison',
          targetHandle: 'right-input',
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#10b981',
          },
          style: {
            strokeWidth: 3,
            stroke: '#10b981',
          },
          label: `${comparison.right_row_count?.toLocaleString() || 0} rows`,
          labelStyle: { fontSize: 13, fontWeight: 700, fill: '#065f46' },
          labelBgStyle: { fill: '#d1fae5', fillOpacity: 0.95 },
        });
      }
    }

    return { nodes, edges };
  }, [leftMetrics, rightMetrics, comparison]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Handle double-click on nodes to show data
  const handleNodeDoubleClick = (_event: React.MouseEvent, node: Node) => {
    if (node.type === 'pipelineStep') {
      setSelectedNode({
        step: node.data.step,
        operation: node.data.operation,
        pipeline: node.data.pipeline,
        rowCount: node.data.row_count,
      });
      setIsModalOpen(true);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setPage(1);
    setPageSize(50);
    setInputValues({});
    setColumnFilters({});
  };

  // Clear all filters
  const clearAllFilters = () => {
    setInputValues({});
    setColumnFilters({});
    setPage(1);
  };

  // Stable callback for filter changes (prevents header re-render)
  const handleFilterChange = useCallback((col: string, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [col]: value,
    }));
  }, []);

  if (!leftMetrics?.length && !rightMetrics?.length) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p>No pipeline metrics available for visualization.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="h-[700px] w-full rounded-lg border bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'comparisonStep') return '#c7d2fe';

            const isLeftPipeline = node.data.pipeline === 'Left';

            switch (node.data.operation) {
              case 'SOURCE':
                return isLeftPipeline ? '#dbeafe' : '#d1fae5'; // blue / green
              case 'JOIN':
                return isLeftPipeline ? '#e9d5ff' : '#99f6e4'; // purple / teal
              case 'FILTER':
                return isLeftPipeline ? '#fef3c7' : '#d9f99d'; // yellow / lime
              case 'MAP':
                return isLeftPipeline ? '#e0e7ff' : '#d1fae5'; // indigo / emerald
              case 'LOOKUP':
                return isLeftPipeline ? '#fed7aa' : '#cffafe'; // orange / cyan
              default:
                return '#f3f4f6';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>

    {/* Data Preview Modal */}
    <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {selectedNode?.operation}
            </Badge>
            <span>{selectedNode?.step}</span>
            <Badge variant="secondary" className="text-xs">
              {selectedNode?.pipeline} Pipeline
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {stepData?.step.description || `Preview data at this pipeline step (${selectedNode?.rowCount.toLocaleString()} total rows)`}
          </DialogDescription>
        </DialogHeader>

        {/* Filter Summary */}
        {(filters.length > 0 || isFilterPending) && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-md">
            <FilterIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {isFilterPending ? 'Applying Filters...' : 'Active Filters:'}
            </span>
            {isFilterPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {filters.map((filter, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {filter.column}: {filter.value}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => {
                    setInputValues((prev) => {
                      const newFilters = { ...prev };
                      delete newFilters[filter.column];
                      return newFilters;
                    });
                    setColumnFilters((prev) => {
                      const newFilters = { ...prev };
                      delete newFilters[filter.column];
                      return newFilters;
                    });
                    setPage(1);
                  }}
                />
              </Badge>
            ))}
            {filters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs">
                Clear All
              </Button>
            )}
          </div>
        )}

        {/* Data Table */}
        <div className="flex-1 overflow-auto border rounded-md relative">
          {!stepData || !stepData.columns || stepData.columns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold">No Data Available</p>
              <p className="text-sm mt-2">
                This step has no records to display.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeaderWithFilters
                  columns={stepData.columns}
                  inputValues={inputValues}
                  onFilterChange={handleFilterChange}
                />
                <TableBody>
                  {!stepDataLoading && stepData.records && stepData.records.length > 0 ? (
                    stepData.records.map((row, idx) => (
                      <TableRow key={idx}>
                        {stepData.columns.map((col) => (
                          <TableCell key={col} className="text-sm">
                            {String(row[col] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !stepDataLoading && filters.length > 0 ? (
                    <TableRow>
                      <TableCell colSpan={stepData.columns.length} className="text-center py-12 text-muted-foreground">
                        <FilterIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-semibold">No Results Found</p>
                        <p className="text-sm mt-2">Try adjusting your filters.</p>
                        <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                          Clear Filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>

              {/* Loading overlay - shows on top of table without unmounting it */}
              {stepDataLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading data...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {stepData?.pagination && stepData.pagination.totalPages > 0 && (
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <span className="text-sm text-muted-foreground">
                Showing {((stepData.pagination.page - 1) * stepData.pagination.limit) + 1} - {Math.min(stepData.pagination.page * stepData.pagination.limit, stepData.pagination.total)} of {stepData.pagination.total.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || stepDataLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {stepData.pagination.page} of {stepData.pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === stepData.pagination.totalPages || stepDataLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <Button variant="outline" onClick={handleModalClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
