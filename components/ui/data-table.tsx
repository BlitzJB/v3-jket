"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface DataTableProps<TData> {
  columns: {
    accessorKey?: string
    header?: string | React.ReactNode | ((props: { column: any }) => React.ReactNode)
    cell?: (props: { row: { original: TData } }) => React.ReactNode
    id?: string
  }[]
  data: TData[]
  pagination?: boolean
  search?: string
  searchPlaceholder?: string
}

export function DataTable<TData>({
  columns,
  data,
  pagination = false,
  search,
  searchPlaceholder = "Search...",
}: DataTableProps<TData>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  let filteredData = [...data]
  if (search && searchQuery) {
    filteredData = data.filter((item: any) =>
      String(item[search])
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = pagination
    ? filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredData

  return (
    <div className="w-full">
      {search && (
        <div className="mb-4 px-4">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={column.id || column.accessorKey || index}>
                {typeof column.header === 'function'
                  ? column.header({ column })
                  : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((row: any, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <TableCell key={column.id || column.accessorKey || columnIndex}>
                  {column.cell
                    ? column.cell({ row: { original: row } })
                    : column.accessorKey
                    ? row[column.accessorKey]
                    : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && totalPages > 1 && (
        <div className="py-4 px-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  isActive={currentPage !== 1}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  isActive={currentPage !== totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
} 