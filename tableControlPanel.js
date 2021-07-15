'use strict';

const tableControlPanel = (function(){
  let getSelectionStart = function() {
    var node = document.getSelection().anchorNode;
    if(!node) return document.body;
    return (node.cellType == 3 ? node.parentNode : node);
 }
  let searchTd = (event)=>{
    let node = event.target;
    // console.log(node);
    // var node = getSelectionStart();
    tableControlPanel.show(node);
  }
  let redraw = (event)=>{
    tableControlPanel.redraw();
  }
  let tableControlPanel = {
    debug:false,
    activedTcps:null,
    addedEvent:false,
    addEvent:function(w){
      if(this.addedEvent){return false;}
      // w.addEventListener('focus',searchTd);
      w.addEventListener('click',searchTd);
      w.addEventListener('scroll',redraw);
      w.addEventListener('resize',redraw);
      this.addedEvent = !this.addedEvent;
    },
    createTcpr:function(){
      let d = document;
      let tcpr = d.createElement('div');
      tcpr.className = 'tcp-row-panel';
      let insertRowUp = d.createElement('button');
      insertRowUp.className = 'tcp-btn-insert-row-up';
      insertRowUp.onclick = function(){ tableControlPanel.insertRow(0)};
      tcpr.appendChild(insertRowUp);
      let insertRowDown = d.createElement('button');
      insertRowDown.onclick = function(){ tableControlPanel.insertRow(1)};
      insertRowDown.className = 'tcp-btn-insert-row-down';
      tcpr.appendChild(insertRowDown);
      let deleteRow = d.createElement('button');
      deleteRow.onclick = function(){ tableControlPanel.deleteRow(0)};
      deleteRow.className = 'tcp-btn-delete-row';
      tcpr.appendChild(deleteRow);
      let deco = d.createElement('div');
      deco.className = 'tcp-panel-deco';
      tcpr.appendChild(deco);

      return tcpr;
    },
    createTcpc:function(){
      let d = document;
      let tcpc = d.createElement('div');
      tcpc.className = 'tcp-col-panel';

      let insertCellLeft = d.createElement('button');
      insertCellLeft.className = 'tcp-btn-insert-cell-left';
      insertCellLeft.onclick = function(){ tableControlPanel.insertCell(0)};
      tcpc.appendChild(insertCellLeft);
      let insertCellRight = d.createElement('button');
      insertCellRight.onclick = function(){ tableControlPanel.insertCell(1)};
      insertCellRight.className = 'tcp-btn-insert-cell-right';
      tcpc.appendChild(insertCellRight);
      let deleteCell = d.createElement('button');
      deleteCell.onclick = function(){ tableControlPanel.deleteCell(0)};
      deleteCell.className = 'tcp-btn-delete-cell';
      tcpc.appendChild(deleteCell);
      let deco = d.createElement('div');
      deco.className = 'tcp-panel-deco';
      tcpc.appendChild(deco);

      return tcpc;
    },
    appendTcps:function(cell){
      let tcps,tcpr,tcpc ;
      let w = cell.ownerDocument.defaultView;
      let d = w.document
      if(w.__tcps){
        if(this.debug) console.log('이미 tcps가 생성되어있음.');
        tcps = w.__tcps;
      }else{
        tcps = {}
        tcpr = this.createTcpr();
        d.body.appendChild(tcpr);
        tcpc = this.createTcpc();
        d.body.appendChild(tcpc);
        w.__tcps = tcps;
        tcps.tcpr = tcpr;
        tcps.tcpc = tcpc;
      }
      this.activedTcps = tcps;
      this.activedTcps.w = w;
      this.activedTcps.d = d;
      this.activedTcps.cell = cell
      this.activedTcps.tr = cell.parentNode;
      this.activedTcps.table = cell.closest('table');
      return tcps;
    },
    redraw:function(){
      if(this.activedTcps && this.activedTcps.cell && this.activedTcps.d){
        if(this.activedTcps.d.body.classList.contains('tcp-on')){
          this.show(this.activedTcps.cell)
        }
      }
    },
    show:function(node){
      if(node.closest('.tcp-row-panel , .tcp-col-panel')){return}
      let cell = node.closest('td,th');
      if(!cell || (cell.tagName!='TD' && cell.tagName!='TH')){
        if(this.debug) console.log('TD,TH만 동작');
        this.hide();
        return false;
      }
      let enabled = cell.closest('.tcp-enabled,.tcp-disabled');
      if(!enabled || !enabled.classList.contains('tcp-enabled')){
        if(this.debug) console.log('.tcp-enabled 속에서만 동작');
        this.hide();
        return false;
      }
      // console.log("show 동작");
      this.appendTcps(cell);
      let w = this.activedTcps.w;
      let d = this.activedTcps.d
      let tr = this.activedTcps.tr
      d.body.classList.add('tcp-on');
      let table = this.activedTcps.table;

      let cells = table.querySelectorAll('td,th');
      let firstCell = cells[0];
      let lastCell = cells[cells.length-1];
      let firstCellRect = firstCell.getBoundingClientRect();
      let lastCellRect = lastCell.getBoundingClientRect();
      let top = firstCellRect.top;
      let right = lastCellRect.right;
      let left = firstCellRect.left;
      let bottom = lastCellRect.bottom;
      let width = right - left;
      let height = bottom - top;

      let tdRect = cell.getBoundingClientRect();
      let trRect = tr.getBoundingClientRect();
      let cellColSpan1 = cell;
      let rowsCells = this.getRowsCells(table);
      if(cell.colSpan>1){
        console.log(cell.__ridx,cell.__cidx);
        for(let i=0,m=rowsCells.length;i<m;i++){
          if(rowsCells[i][cell.__cidx].colSpan==1){
            cellColSpan1 = rowsCells[i][cell.__cidx];
            break;
          }
        }
      }
      let cellColSpan1Rect = cellColSpan1.getBoundingClientRect();


      let tcps = w.__tcps;
      tcps.tcpr.style.left=left+'px'
      tcps.tcpr.style.top=tdRect.top+'px'
      tcps.tcpr.style.width=width+'px'
      tcps.tcpr.style.height=trRect.height+'px'
      tcps.tcpc.style.left=tdRect.left+'px'
      tcps.tcpc.style.top=top+'px'
      tcps.tcpc.style.width=cellColSpan1Rect.width+'px'
      tcps.tcpc.style.height=height+'px'
    },
    hide:function(){
      if(this.activedTcps){
        // let w = this.activedTcps.w;
        let d = this.activedTcps.d;
        d.body.classList.remove('tcp-on');
        this.activedTcps.w = null;
        this.activedTcps.d = null;
        this.activedTcps.cell = null;
        this.activedTcps.tr = null;
        this.activedTcps.table = null;
      }
      window.document.body.classList.remove('tcp-on');
    },
    insertRow:function(isDown){
      if(!this.activedTcps){ if(this.debug) console.log('activedTcps가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcps.cell){ if(this.debug) console.log('activedTcps.cell가 있어야만 동작합니다.'); return false; }
      let cell = this.activedTcps.cell;
      let table = this.activedTcps.table;
      if(!table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let tr = this.activedTcps.tr;
      // let table = this.activedTcps.table;
      let new_tr = table.insertRow(tr.rowIndex+isDown);
      let cells = this.getCells(tr);
      let new_td = null;
      for(let i=0,m=cells.length;i<m;i++){
        new_td = new_tr.insertCell(-1);
        new_td.innerHTML = '&nbsp;';
      }
      this.show(cell);
    },
    deleteRow:function(){
      if(!this.activedTcps){ if(this.debug) console.log('activedTcps가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcps.cell){ if(this.debug) console.log('activedTcps.cell가 있어야만 동작합니다.'); return false; }
      let cell = this.activedTcps.cell;
      let tr = this.activedTcps.tr;
      let table = this.activedTcps.table;
      if(!table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let rowsCells = this.getRowsCells(table);
      let ridx = cell.__ridx;
      if(rowsCells[ridx].length==1){ if(this.debug) console.log('table속 tr의 수가 1개에서는 삭제가 불가합니다.'); return false; }
      let targetCells = {};
      rowsCells[ridx].forEach((cell)=>{
        if(cell.rowSpan > 1){
          targetCells[cell.__ridx+"_"+cell.__cidx] = cell;
        }
      })
      for(let k in targetCells){
        targetCells[k].rowSpan--;
        if(targetCells[k].__ridx == cell.__ridx){
          table.rows[ridx].insertCell(targetCells[k].__cidx)
        }
      }
      cell.parentNode.remove()

      this.hide();
    },
    insertCell(isRight){
      if(!this.activedTcps){ if(this.debug) console.log('activedTcps가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcps.cell){ if(this.debug) console.log('activedTcps.cell가 있어야만 동작합니다.'); return false; }
      let cell = this.activedTcps.cell;
      let table = this.activedTcps.table;
      let cellIndex = cell.cellIndex+isRight;
      let rowsCells = this.getRowsCells(table);
      rowsCells.forEach((cells)=>{
        if(cells[cellIndex].colSpan==1){
          cells[cellIndex].parentNode.insertCell(cellIndex);
        }else{
          cells[cellIndex].colSpan++;
        }
      })
      this.show(cell);
    },
    deleteCell(){
      if(!this.activedTcps){ if(this.debug) console.log('activedTcps가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcps.cell){ if(this.debug) console.log('activedTcps.cell가 있어야만 동작합니다.'); return false; }
      let cell = this.activedTcps.cell;
      let table = this.activedTcps.table;
      let rowsCells = this.getRowsCells(table);
      let cidx = cell.__cidx;
      let targetCells = {};
      rowsCells.forEach((cells)=>{
        if(cells[cidx].colSpan==1){
          cells[cidx].remove()
        }else{
          targetCells[cell.__ridx+"_"+cell.__cidx] = cells[cidx];
        }
      })
      for(let k in targetCells){
        targetCells[k].colSpan--;
      }
      this.show(cell);
    },
    getCells:function(tr){
      let cells = [];
      [...tr.cells].forEach((cell)=>{
        for(let i=0,m=cell.colSpan;i<m;i++){
          cells.push(cell);
        }
      });
      return cells;
    },
    getRowsCellsCounts:function(table){
      let rowCount = table.rows.length;
      let cellCount = 0;
      let tr,td;
      for(const tr of table.rows){
        let sum = 0;
        for(const td of tr.cells){
          sum+=td.colSpan;
        }
        cellCount = Math.max(cellCount,sum)
      };
      return {rowCount:rowCount,cellCount:cellCount}
    },
    getRowsCells:function(table){
      let cnts = this.getRowsCellsCounts(table);
      // 기본 배열 만들기
      let rowsCells = new Array(cnts.rowCount);
      for(let i=0,m=rowsCells.length;i<m;i++){
        rowsCells[i] = new Array(cnts.cellCount)
        rowsCells[i].fill(null,0);
      }

      [...table.rows].forEach((row)=>{
        let cells = row.cells;
        let rowIndex = row.rowIndex;
        let cellIndex =0;
        [...cells].forEach((cell)=>{
          while(rowsCells[rowIndex][cellIndex]){
            cellIndex++;
          }
          if(cellIndex>=rowsCells[rowIndex].length){return}
          for(let i=0,m=cell.rowSpan;i<m;i++){
            rowsCells[rowIndex+i].fill(cell,cellIndex,cellIndex+cell.colSpan)
          }
          cell.__ridx = rowIndex;
          cell.__cidx = cellIndex;
          cellIndex += cell.colSpan;
        })
      })
      return rowsCells;
    }


  }
  return tableControlPanel;
})()