import React, { ReactNode, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  isLoading?: boolean;
  data?: any[];
  columns?: any[];
  onRowClick?: (row: any) => void;
}

interface TableHeaderProps extends Omit<TableProps, 'onRowClick' | 'data' | 'columns' | 'isLoading'> {
  children: ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc';
  onSort?: () => void;
}

interface TableBodyProps extends Omit<TableProps, 'columns' | 'isLoading'> {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  data?: any[];
  onRowClick?: (row: any) => void;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

interface TableFooterProps extends Omit<TableProps, 'onRowClick' | 'data' | 'columns' | 'isLoading'> {
  children: ReactNode;
  className?: string;
}

const Table = forwardRef<HTMLTableElement, TableProps>(({
  children,
  className = '',
  striped = false,
  hoverable = true,
  compact = false,
  isLoading = false,
  data = [],
  columns = [],
  onRowClick,
  ...props
}, ref) => {
  const tableClasses = twMerge(
    'min-w-full divide-y divide-gray-200',
    compact ? 'text-sm' : 'text-base',
    className
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isLoading && data && data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table
        ref={ref}
        className={tableClasses}
        {...props}
      >
        {children}
      </table>
    </div>
  );
});

Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(({ 
  children, 
  className = '',
  ...props 
}, ref) => (
  <thead
    ref={ref}
    className={twMerge('bg-gray-50', className)}
    {...props}
  >
    {children}
  </thead>
));

TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(({ 
  children, 
  className = '', 
  striped = false, 
  hoverable = true,
  data = [],
  onRowClick,
  ...props 
}, ref) => (
  <tbody
    ref={ref}
    className={twMerge(
      'bg-white divide-y divide-gray-200',
      striped ? 'divide-y divide-gray-200' : '',
      hoverable ? 'hover:bg-gray-50' : '',
      className
    )}
    {...props}
  >
    {React.Children.map(children, (child, index) => {
      if (React.isValidElement(child) && child.type === TableRow && onRowClick) {
        return React.cloneElement(child, {
          onClick: () => onRowClick(data[index]),
          className: twMerge(child.props.className, 'cursor-pointer hover:bg-gray-50')
        });
      }
      return child;
    })}
  </tbody>
));

TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(({ 
  children, 
  className = '', 
  hover = true, 
  onClick,
  ...props 
}, ref) => (
  <tr
    ref={ref}
    className={twMerge(
      hover ? 'hover:bg-gray-50' : '',
      onClick ? 'cursor-pointer' : '',
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </tr>
));

TableRow.displayName = 'TableRow';

const TableHead = forwardRef<HTMLTableCellElement, TableHeaderProps>(({ 
  children, 
  className = '', 
  sortable = false, 
  sortDirection,
  onSort,
  ...props 
}, ref) => {
  const handleClick = () => {
    if (sortable && onSort) {
      onSort();
    }
  };

  return (
    <th
      ref={ref}
      scope="col"
      className={twMerge(
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        sortable ? 'cursor-pointer select-none' : '',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center">
        {children}
        {sortable && (
          <span className="ml-2">
            {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
          </span>
        )}
      </div>
    </th>
  );
});

TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(({ 
  children, 
  className = '', 
  align = 'left',
  ...props 
}, ref) => {
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      ref={ref}
      className={twMerge(
        'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
        alignmentClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(({ 
  children, 
  className = '', 
  ...props 
}, ref) => (
  <tfoot
    ref={ref}
    className={twMerge('bg-gray-50', className)}
    {...props}
  >
    {children}
  </tfoot>
));

TableFooter.displayName = 'TableFooter';

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
};

export type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableCellProps,
  TableRowProps,
  TableFooterProps,
};