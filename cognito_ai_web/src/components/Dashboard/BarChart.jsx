import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const BarChart = ({ labels, failedData, successData }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'failed',
        data: failedData,
        backgroundColor: '#3B82F6',
      },
      {
        label: 'Success',
        data: successData,
        backgroundColor: '#34D399',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
  };

  return <Bar data={data} options={options} />;
};

export default BarChart;
