"use client";

import { forwardRef, useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Icons ---
import { TableIcon } from "@/components/tiptap-icons/table-icon";
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/tiptap-ui-primitive/popover";

// --- Styles ---
import "./table-picker.scss";

interface TableDropdownMenuProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null;
  modal?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

const GRID_SIZE = 8;

export const TableDropdownMenu = forwardRef<
  HTMLButtonElement,
  TableDropdownMenuProps
>(({ editor: providedEditor, onOpenChange, modal, ...props }, ref) => {
  const { editor } = useTiptapEditor(providedEditor);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredRows, setHoveredRows] = useState(3);
  const [hoveredCols, setHoveredCols] = useState(3);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) {
        setHoveredRows(3);
        setHoveredCols(3);
      }
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  if (!editor) return null;

  const isInTable = editor.isActive("table");

  const handleInsertTable = (rows: number, cols: number) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setIsOpen(false);
  };

  const runCommand = (cmd: () => void) => {
    cmd();
    setIsOpen(false);
  };

  return (
    <Popover modal={modal} open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          data-active-state={isInTable ? "on" : "off"}
          role="button"
          tabIndex={-1}
          aria-label="Table options"
          tooltip="Table"
          {...props}
          ref={ref}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-0 border-none bg-transparent shadow-none"
      >
        <div className="table-grid-picker">
          {!isInTable ? (
            <>
              {/* Visual Grid Matrix (8x8) */}
              <div
                className="grid-matrix"
                role="grid"
                aria-label="Table size picker"
                onMouseLeave={() => {
                  setHoveredRows(3);
                  setHoveredCols(3);
                }}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }).map(
                  (_, index) => {
                    const row = Math.floor(index / GRID_SIZE) + 1;
                    const col = (index % GRID_SIZE) + 1;
                    const isSelected = row <= hoveredRows && col <= hoveredCols;

                    return (
                      <div
                        key={index}
                        className={`grid-cell ${isSelected ? "is-selected" : ""}`}
                        onMouseEnter={() => {
                          setHoveredRows(row);
                          setHoveredCols(col);
                        }}
                        onClick={() =>
                          handleInsertTable(hoveredRows, hoveredCols)
                        }
                        role="gridcell"
                        aria-label={`${col} columns by ${row} rows`}
                      />
                    );
                  },
                )}
              </div>

              {/* Bottom Info Pills: [Cols Icon] X x [Rows Icon] Y */}
              <div className="grid-footer">
                <div className="grid-pill">
                  {/* Columns SVG */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M9 3v18" />
                    <path d="M15 3v18" />
                  </svg>
                  <span>{hoveredCols}</span>
                </div>

                <span className="grid-separator">x</span>

                <div className="grid-pill">
                  {/* Rows SVG */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M3 15h18" />
                  </svg>
                  <span>{hoveredRows}</span>
                </div>
              </div>
            </>
          ) : (
            /* In-Table Operations Menu */
            <div className="table-actions-menu">
              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  runCommand(() =>
                    editor.chain().focus().addColumnBefore().run(),
                  )
                }
              >
                Add column before
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  runCommand(() =>
                    editor.chain().focus().addColumnAfter().run(),
                  )
                }
              >
                Add column after
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  runCommand(() => editor.chain().focus().deleteColumn().run())
                }
              >
                Delete column
              </button>

              <div className="divider" />

              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  runCommand(() => editor.chain().focus().addRowBefore().run())
                }
              >
                Add row before
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  runCommand(() => editor.chain().focus().addRowAfter().run())
                }
              >
                Add row after
              </button>
              <button
                type="button"
                className="action-btn"
                onClick={() =>
                  runCommand(() => editor.chain().focus().deleteRow().run())
                }
              >
                Delete row
              </button>

              <div className="divider" />

              <button
                type="button"
                className="action-btn destructive"
                onClick={() =>
                  runCommand(() => editor.chain().focus().deleteTable().run())
                }
              >
                Delete table
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
});

TableDropdownMenu.displayName = "TableDropdownMenu";
