"use client";

import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "./Table";
import { Pagination } from "./Pagination";

export interface ColumnDef<T> {
    header: React.ReactNode;
    accessorKey?: keyof T;
    cell?: (item: T, index: number) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    isLoading?: boolean;
    onRowClick?: (item: T) => void;
    rowClassName?: (item: T) => string;
}

const ITEMS_PER_PAGE = 10;

export function DataTable<T extends { id?: number | string }>({
    data,
    columns,
    isLoading = false,
    onRowClick,
    rowClassName
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter data based on search query
    const filteredData = React.useMemo(() => {
        if (!searchQuery) return data;
        const lowerQuery = searchQuery.toLowerCase();
        return data.filter((item) => {
            return Object.values(item as any).some((val) =>
                String(val).toLowerCase().includes(lowerQuery)
            );
        });
    }, [data, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    // Reset to first page if search query changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Ensure we don't stay on page 5 if there is only 1 page of data.
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center pt-[5px]">
                <div className="relative w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 pt-[5px] border border-gray-300 shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="overflow-x-auto bg-white shadow-sm border border-gray-200">
                <Table isLoading={isLoading} hoverable striped>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, idx) => (
                                <TableHead key={idx} className={col.className}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, rowIdx) => (
                                <TableRow
                                    key={item.id || rowIdx}
                                    onClick={() => onRowClick?.(item)}
                                    className={rowClassName ? rowClassName(item) : undefined}
                                >
                                    {columns.map((col, colIdx) => (
                                        <TableCell key={colIdx} className={col.className}>
                                            {col.cell
                                                ? col.cell(item, startIndex + rowIdx)
                                                : col.accessorKey
                                                    ? (item[col.accessorKey] as React.ReactNode)
                                                    : null}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-8 text-gray-500">
                                    {searchQuery ? "No matching records found." : "No data available."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredData.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                />
            )}
        </div>
    );
}
