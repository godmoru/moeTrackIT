import React, { ReactNode, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

// ========================
// Props Interfaces
// ========================

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  isLoading?: boolean;
}

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

// ========================
// Table
// ========================

const Table = forwardRef<HTMLTableElement, TableProps>(
  (
    {
      children,
      className = '',
      striped = false,
      hoverable = true,
      compact = false,
      isLoading = false,
      ...props
    },
    ref
  ) => {
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

    return (
      <div className="overflow-x-auto">
        <table ref={ref} className={tableClasses} {...props}>
          {children}
        </table>
      </div>
    );
  }
);
Table.displayName = 'Table';

// ========================
// TableHeader
// ========================

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <thead ref={ref} className={twMerge('bg-gray-50', className)} {...props}>
      {children}
    </thead>
  )
);
TableHeader.displayName = 'TableHeader';

// ========================
// TableBody – Fixed TypeScript Issue
// ========================

// Type guard to ensure child is a TableRow element
function isTableRowElement(
  child: React.ReactNode
): child is React.ReactElement<TableRowProps> {
  return React.isValidElement(child) && (child as any).type === TableRow;
}

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className = '', striped = false, hoverable = true, ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={twMerge('divide-y divide-gray-200 bg-white', className)}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!isTableRowElement(child)) {
            return child;
          }

          const rowClasses = twMerge(
            striped && index % 2 === 1 && 'bg-gray-50',
            hoverable && 'hover:bg-gray-100'
          );

          return React.cloneElement(child, {
            className: twMerge(child.props.className, rowClasses),
          });
        })}
      </tbody>
    );
  }
);
TableBody.displayName = 'TableBody';

// ========================
// TableRow
// ========================

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = '', onClick, ...props }, ref) => (
    <tr
      ref={ref}
      className={twMerge(onClick && 'cursor-pointer', className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  )
);
TableRow.displayName = 'TableRow';

// ========================
// TableHead
// ========================

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    {
      children,
      className = '',
      sortable = false,
      sortDirection = null,
      onSort,
      ...props
    },
    ref
  ) => {
    const handleClick = () => {
      if (sortable && onSort) onSort();
    };

    return (
      <th
        ref={ref}
        scope="col"
        className={twMerge(
          'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
          sortable && 'cursor-pointer select-none hover:text-gray-900',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="flex items-center gap-2">
          {children}
          {sortable && (
            <span className="text-gray-400 text-sm">
              {sortDirection === 'asc' ? '↑' : sortDirection === 'desc' ? '↓' : '↕'}
            </span>
          )}
        </div>
      </th>
    );
  }
);
TableHead.displayName = 'TableHead';

// ========================
// TableCell
// ========================

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className = '', align = 'left', ...props }, ref) => {
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <td
        ref={ref}
        className={twMerge(
          'px-6 py-3 whitespace-nowrap text-sm text-gray-900',
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </td>
    );
  }
);
TableCell.displayName = 'TableCell';

// ========================
// TableFooter
// ========================

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <tfoot ref={ref} className={twMerge('bg-gray-50', className)} {...props}>
      {children}
    </tfoot>
  )
);
TableFooter.displayName = 'TableFooter';

// ========================
// Exports
// ========================

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
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableFooterProps,
};