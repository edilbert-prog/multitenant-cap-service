import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  TooltipItem,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  labels: string[];
  data: number[];
  label?: string;
  backgroundColor?: string;
  borderColor?: string;
  maxValue?: number;
}

export default function BarChart({
                                   labels,
                                   data,
                                   label = 'Count',
                                   backgroundColor = 'rgba(59, 130, 246, 0.5)',
                                   borderColor = 'rgba(59, 130, 246, 1)',
                                   maxValue = 0,
                                 }: Props) {
  const chartData: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: label,
        data: data,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            return `${label}: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: maxValue + 50,
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
      <div style={{ height: '350px' }}>
        <Bar data={chartData} options={options} />
      </div>
  );
}
