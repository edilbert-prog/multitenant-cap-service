import React from 'react';
import { ICellRendererParams } from 'ag-grid-community';

// A simple "smart" cell renderer that just displays the value.
// This can be expanded with more complex logic (e.g., formatting, icons) as needed.
const SmartCellRenderer: React.FC<ICellRendererParams> = (props) => {
  return (
    <span>{props.value}</span>
  );
};

export default SmartCellRenderer;
