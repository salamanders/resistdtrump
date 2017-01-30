/*jshint esversion: 6, unused:true  */
/*exported sheetToObject, */

/**
* I hate guard dogs
*/

/*
convert a sheet to a single object.
Based on single-frozen-header-row names, good for config files
*/
function sheetToObject(sheet) {
  return sheet.sheets.reduce(function(prev,cur){
    prev[cur.properties.title] = tableToObject(trimFlat(worksheetToFlat(cur)));
    return prev;
  }, {});
}

/**
Utility function to take a table's first header row and use it as object property names
*/
function tableToObject(table) {
  let result = [];
  for (let rowNum = 1; rowNum < table.length; rowNum++) {
    let newRow = {};
    for (let colNum = 0; colNum < table[rowNum].length; colNum++) {
      newRow[table[0][colNum]] = table[rowNum][colNum];
    }
    result.push(newRow);
  }
  return result;
}

/*
 Utility function to convert a sheet to a flat data structure.
 build a flattened, un-merged table, no array gaps (use nulls to fill in)
 Changes the data in frozen rows/cols: filling top (over) and left (down) into gaps.
 Removes completely empty rows and columns.
 The fill-down could be an issue.
*/
function worksheetToFlat(ws) {
  let flatTable = [];

  // Squorsh it into a nice rectangular 2d array with nulls, do some trimming, keep track of rows/cols w data
  for (let rowNum = 0; rowNum < ws.properties.gridProperties.rowCount; rowNum++) {
    let flatRow = [];
    for (let colNum = 0; colNum < ws.properties.gridProperties.columnCount; colNum++) {
      if (ws.data[0].rowData[rowNum] &&
        ws.data[0].rowData[rowNum].values &&
        ws.data[0].rowData[rowNum].values[colNum] &&
        ws.data[0].rowData[rowNum].values[colNum].formattedValue) {
        flatRow.push(('' + ws.data[0].rowData[rowNum].values[colNum].formattedValue).replace(/\s+/, ' ').trim());
      } else {
        flatRow.push(null);
      }
    }
    flatTable.push(flatRow);
  }
  return flatTable;
}

/**
Snip out empty rows and columns
*/
function trimFlat(flatTable, frozenRows=0, frozenColumns=0) {
  let rowHasData = [],
    columnHasData = [];

  for (let rowNum = frozenRows; rowNum < flatTable.length; rowNum++) {
    for (let colNum = frozenColumns; colNum < flatTable[rowNum].length; colNum++) {
      if(flatTable[rowNum][colNum]) {
        rowHasData[rowNum] = true;
        columnHasData[colNum] = true;          
      }
    }
  }

  // Non-frozen blank rows are boooooring.
  for (let rowNum = flatTable.length; rowNum >= frozenRows; rowNum--) {
    if (!rowHasData[rowNum]) {
      flatTable.splice(rowNum, 1);
    }
  }

  // Non-frozen blank columns are boooooring as well, but harder to get rid of.
  for (let colNum = flatTable[0].length; colNum >= frozenColumns; colNum--) {
    if (!columnHasData[colNum]) {
      for (let rowNum = 0; rowNum < flatTable.length; rowNum++) {
        flatTable[rowNum].splice(colNum, 1);
      }
    }
  }

  return flatTable;
}