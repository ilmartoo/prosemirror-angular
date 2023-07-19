/**
 * Custom ProseMirror helper functions for tables management
 */

import {Node as ProseNode} from 'prosemirror-model';
import {customSchema} from '../text-editor/custom-schema';
import {repeat} from './multipurpose-helper';

/**
 * Creates a table with the specified rows and columns.
 * If the number of rows or columns is 0 or less, an empty table is created.
 * @param rows Number of rows
 * @param cols Number of columns
 * @returns Table node with the specified dimensions
 */
export function createTable(rows: number, cols: number): ProseNode {
  if (rows < 1 || cols < 1) {
    return customSchema.nodes.table.create();
  }

  const paragraph = customSchema.nodes.paragraph.create();
  const cell = customSchema.nodes.table_cell.create(null, paragraph);
  const rowCells = repeat(cell, cols);

  const row = customSchema.nodes.table_row.create(null, rowCells);
  const tableRows = repeat(row, rows);

  return customSchema.nodes.table.create(null, tableRows);
}
