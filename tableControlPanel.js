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
    activedTcpcs:null,
    addedEvent:false,
    addEvent:function(w){
      if(this.addedEvent){return false;}
      // w.addEventListener('focus',searchTd);
      w.addEventListener('click',searchTd);
      w.addEventListener('scroll',redraw);
      w.addEventListener('resize',redraw);
      this.addedEvent = !this.addedEvent;
    },
    createTcpcs:function(d){
      let html = //<div class="tcp-control tcpcs">
        '<div class="tcp-control tcp-row tcprow">\
          <div class="tcp-panel" title="row control">\
            <button class="tcp-btn tcp-btn-insertRow-0" ></button>\
            <button class="tcp-btn tcp-btn-deleteRow" ></button>\
            <button class="tcp-btn tcp-btn-insertRow-1" ></button>\
            <div  class="tcp-deco"></div>\
          </div>\
        </div>\
        <div class="tcp-control tcp-col tcpcol">\
          <div class="tcp-panel"  title="cell control">\
            <button class="tcp-btn tcp-btn-insertCell-0" ></button>\
            <button class="tcp-btn tcp-btn-deleteCell" ></button>\
            <button class="tcp-btn tcp-btn-insertCell-1" ></button>\
            <div  class="tcp-deco"></div>\
          </div>\
        </div>\
        <div class="tcp-control tcp-cell tcpcell">\
          <div class="tcp-panel" title="merge control">\
            <button class="tcp-btn tcp-btn-merge-up" ></button>\
            <button class="tcp-btn tcp-btn-merge-left" ></button>\
            <button class="tcp-btn tcp-btn-merge-down" ></button>\
            <button class="tcp-btn tcp-btn-merge-right" ></button>\
            <div  class="tcp-deco"></div>\
          </div>\
        </div>\
        ';
      //</div>';
      let tcpcs = d.createElement('div');
      tcpcs.className='tcp-controls tcpcs';
      tcpcs.innerHTML = html;
      tcpcs.querySelector('.tcp-btn-insertRow-0').onclick = function(){ tableControlPanel.insertRow(0)};
      tcpcs.querySelector('.tcp-btn-insertRow-1').onclick = function(){ tableControlPanel.insertRow(1)};
      tcpcs.querySelector('.tcp-btn-deleteRow').onclick = function(){ tableControlPanel.deleteRow()};
      
      tcpcs.querySelector('.tcp-btn-insertCell-0').onclick = function(){ tableControlPanel.insertCell(0)};
      tcpcs.querySelector('.tcp-btn-insertCell-1').onclick = function(){ tableControlPanel.insertCell(1)};
      tcpcs.querySelector('.tcp-btn-deleteCell').onclick = function(){ tableControlPanel.deleteCell()};
      
      tcpcs.querySelector('.tcp-btn-merge-up').onclick = function(){ tableControlPanel.mergeCell(-1,0)};
      tcpcs.querySelector('.tcp-btn-merge-down').onclick = function(){ tableControlPanel.mergeCell(1,0)};
      tcpcs.querySelector('.tcp-btn-merge-left').onclick = function(){ tableControlPanel.mergeCell(0,-1)};
      tcpcs.querySelector('.tcp-btn-merge-right').onclick = function(){ tableControlPanel.mergeCell(0,1)};

      tcpcs.tcprow = tcpcs.querySelector('.tcprow');
      tcpcs.tcpcol = tcpcs.querySelector('.tcpcol');
      tcpcs.tcpcell = tcpcs.querySelector('.tcpcell');
      document.body.append(tcpcs);
      return tcpcs;
    },
    appendTcps:function(cell){
      let tcpcs;
      let w = cell.ownerDocument.defaultView;
      let d = w.document
      if(w.__tcpcs){
        if(this.debug) console.log('이미 tcpcs가 생성되어있음.');
        tcpcs = w.__tcpcs;
      }else{
        tcpcs = this.createTcpcs(d);
        w.__tcpcs = tcpcs;
      }
      this.activedTcpcs = tcpcs;
      this.activedTcpcs.w = w;
      this.activedTcpcs.d = d;
      this.activedTcpcs.cell = cell
      this.activedTcpcs.tr = cell.parentNode;
      this.activedTcpcs.table = cell.closest('table');
      this.activedTcpcs.rowsCells = this.getRowsCells(this.activedTcpcs.table);
      return tcpcs;
    },
    redraw:function(){
      if(this.activedTcpcs && this.activedTcpcs.cell && this.activedTcpcs.d){
        if(this.activedTcpcs.d.body.classList.contains('tcp-on')){
          this.show(this.activedTcpcs.cell)
        }
      }
    },
    show:function(node){
      if(node.closest('.tcp-controls')){return}
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
      let w = this.activedTcpcs.w;
      let d = this.activedTcpcs.d
      let tr = this.activedTcpcs.tr
      d.body.classList.add('tcp-on');
      let table = this.activedTcpcs.table;
      let rowsCells = this.activedTcpcs.rowsCells;

      this.activedTcpcs.setAttribute('data-cell-ridx',this.activedTcpcs.cell.__ridx)
      this.activedTcpcs.setAttribute('data-cell-cidx',this.activedTcpcs.cell.__cidx)


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
      if(cell.colSpan>1){
        for(let i=0,m=rowsCells.length;i<m;i++){
          if(rowsCells[i][cell.__cidx].colSpan==1){
            cellColSpan1 = rowsCells[i][cell.__cidx];
            break;
          }
        }
      }
      let cellColSpan1Rect = cellColSpan1.getBoundingClientRect();


      let tcpcs = w.__tcpcs;
      tcpcs.tcprow.style.left=left+'px'
      tcpcs.tcprow.style.top=tdRect.top+'px'
      tcpcs.tcprow.style.width=width+'px'
      tcpcs.tcprow.style.height=trRect.height+'px'

      tcpcs.tcpcol.style.left=tdRect.left+'px'
      tcpcs.tcpcol.style.top=top+'px'
      tcpcs.tcpcol.style.width=cellColSpan1Rect.width+'px'
      tcpcs.tcpcol.style.height=height+'px'

      tcpcs.tcpcell.style.left=tdRect.left+'px'
      tcpcs.tcpcell.style.top=tdRect.top+'px'
      tcpcs.tcpcell.style.width=tdRect.width+'px'
      tcpcs.tcpcell.style.height=tdRect.height+'px'

    },
    hide:function(){
      if(this.activedTcpcs){
        // let w = this.activedTcpcs.w;
        let d = this.activedTcpcs.d;
        d.body.classList.remove('tcp-on');
      }
      window.document.body.classList.remove('tcp-on');
    },
    insertRow:function(isDown){
      if(!this.activedTcpcs){ if(this.debug) console.log('activedTcpcs가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.cell){ if(this.debug) console.log('activedTcpcs.cell가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let cell = this.activedTcpcs.cell;
      let table = this.activedTcpcs.table;
      let ridx = cell.__ridx+isDown;
      let rowsCells = this.activedTcpcs.rowsCells;
      table.insertRow(ridx);
      let oldCells = rowsCells[cell.__ridx];
      rowsCells.splice(ridx,0,new Array(rowsCells[0].length));
      let resizedCells = [];
      oldCells.forEach((cell,cidx)=>{
        if(cell && cell.rowSpan>1 && cell.__ridx != ridx){
          if(resizedCells.indexOf(cell)==-1){ //한번만 늘림
            cell.rowSpan++;
            resizedCells.push(cell);
          }
          rowsCells[ridx][cidx] = cell;
        }else{
          let new_td = document.createElement('td');
          new_td.innerHTML = '&nbsp;';
          rowsCells[ridx][cidx] = new_td;
        }
      })
      if(this.debug) console.log(rowsCells);
      this.redrawTableWithRowsCells(table,rowsCells)
      this.show(cell);
    },
    deleteRow:function(){
      if(!this.activedTcpcs){ if(this.debug) console.log('activedTcpcs가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.cell){ if(this.debug) console.log('activedTcpcs.cell가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let cell = this.activedTcpcs.cell;
      let table = this.activedTcpcs.table;
      let rowsCells = this.activedTcpcs.rowsCells;
      let ridx = cell.__ridx;
      if(rowsCells.length==1){ if(this.debug) console.log('table속 tr의 수가 1개에서는 삭제가 불가합니다.'); return false; }

      table.deleteRow(ridx);
      let deletedRowsCells = rowsCells.splice(ridx,1)
      deletedRowsCells.forEach((deletedCells)=>{
        let resizedCells = [];
        deletedCells.forEach((deletedCell)=>{
          if(deletedCell.rowSpan==1){
            deletedCell.remove();
          }else{
            if(resizedCells.indexOf(deletedCell)==-1){ //1row에 한번만 줄임
              deletedCell.rowSpan--;
              resizedCells.push(deletedCell);
            }
          }
        })
      })
      this.redrawTableWithRowsCells(table,rowsCells)
      if(this.debug) console.log(rowsCells);
      this.hide();
    },
    insertCell(isRight){
      if(!this.activedTcpcs){ if(this.debug) console.log('activedTcpcs가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.cell){ if(this.debug) console.log('activedTcpcs.cell가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let cell = this.activedTcpcs.cell;
      let table = this.activedTcpcs.table;
      let cidx = cell.__cidx+isRight;
      let rowsCells = this.activedTcpcs.rowsCells;
      let resizedCells = [];

      rowsCells.forEach((cells,ridx)=>{
        let cell = cells[cidx];
        if(cell && cell.colSpan>1 && cell.__cidx != cidx){
          if(resizedCells.indexOf(cell)==-1){ //한번만 늘림
            cell.colSpan++;
            resizedCells.push(cell);
            console.log(cell);
          }
          // rowsCells[ridx][cidx] = cell;
          rowsCells[ridx].splice(cidx,0,cell);
        }else{
          let new_td = document.createElement('td');
          new_td.innerHTML = '&nbsp;';
          // rowsCells[ridx][cidx] = new_td;
          rowsCells[ridx].splice(cidx,0,new_td);
          console.log(ridx,cidx);
        }
      })
      if(this.debug) console.log(rowsCells);
      this.redrawTableWithRowsCells(table,rowsCells)
      this.show(cell);
    },
    deleteCell(){
      if(!this.activedTcpcs){ if(this.debug) console.log('activedTcpcs가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.cell){ if(this.debug) console.log('activedTcpcs.cell가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let cell = this.activedTcpcs.cell;
      let table = this.activedTcpcs.table;
      let rowsCells = this.activedTcpcs.rowsCells;
      let cidx = cell.__cidx;
      let deletedCells;
      if(rowsCells[0].length==1){ console.warn('cell이 1개만 있습니다. 삭제할 수 없습니다.'); return false; }
      rowsCells.forEach((cells)=>{
        deletedCells = cells.splice(cidx,1);
        deletedCells.forEach((deletedCell)=>{
          if(deletedCell.colSpan==1){
            deletedCell.remove();
          }else{
            deletedCell.colSpan--;
          }
        })
      })
      if(this.debug) console.log(rowsCells);
      this.redrawTableWithRowsCells(table,rowsCells)
      this.show(cell);
    },
    mergeCell(isDown,isRight){
      if(!this.activedTcpcs){ if(this.debug) console.log('activedTcpcs가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.cell){ if(this.debug) console.log('activedTcpcs.cell가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let cell = this.activedTcpcs.cell;
      let ridx = cell.__ridx;
      let cidx = cell.__cidx;
      let table = this.activedTcpcs.table;
      let rowsCells = this.activedTcpcs.rowsCells;
      
      if(isDown == 1){
        if(!rowsCells[ridx+cell.rowSpan+1-1]){ if(this.debug) console.log('없는 row를 지정하였습니다.'); return false; }
        let tCell = rowsCells[ridx+cell.rowSpan+1-1][cidx];
        if (!tCell || tCell.colSpan != cell.colSpan){ console.warn("셀의 모양이 달라 합칠 수 없습니다."); return; }
        if (tCell.parentNode.parentNode != cell.parentNode.parentNode){ console.warn("같은 그룹에 있는 셀만 합칠 수 있습니다."); return; }
        cell.rowSpan+=tCell.rowSpan;
      }
      ridx = cell.__ridx;
      cidx = cell.__cidx;
      if(isDown == -1){
        if(!rowsCells[ridx-1]){ if(this.debug) console.log('없는 row를 지정하였습니다.'); return false; }
        let tCell = rowsCells[ridx-1][cidx];
        if (!tCell || tCell.colSpan != cell.colSpan){ console.warn("셀의 모양이 달라 합칠 수 없습니다."); return; }
        if (tCell.parentNode.parentNode != cell.parentNode.parentNode){ console.warn("같은 그룹에 있는 셀만 합칠 수 있습니다."); return; }
        cell.rowSpan+=tCell.rowSpan;
        rowsCells[tCell.__ridx][tCell.__cidx] = cell;
        cell.__ridx = tCell.__ridx;
        cell.__cidx = tCell.__cidx;
      }
      ridx = cell.__ridx;
      cidx = cell.__cidx;

      if(isRight == 1){
        if(!rowsCells[ridx] || !rowsCells[ridx][cidx+cell.colSpan+1-1] ){ if(this.debug) console.log('없는 cell을 지정하였습니다.'); return false; }
        let tCell = rowsCells[ridx][cidx+cell.colSpan+1-1];
        if (!tCell || tCell.rowSpan != cell.rowSpan){ console.warn("셀의 모양이 달라 합칠 수 없습니다."); return; }
        if (tCell.parentNode.parentNode != cell.parentNode.parentNode){ console.warn("같은 그룹에 있는 셀만 합칠 수 있습니다."); return; }
        cell.colSpan+=tCell.colSpan;
      }
      ridx = cell.__ridx;
      cidx = cell.__cidx;

      if(isRight == -1){
        if(!rowsCells[ridx] || !rowsCells[ridx][cidx-1] ){ if(this.debug) console.log('없는 cell을 지정하였습니다.'); return false; }
        let tCell = rowsCells[ridx][cidx-1];
        if (!tCell || tCell.rowSpan != cell.rowSpan){ console.warn("셀의 모양이 달라 합칠 수 없습니다."); return; }
        if (tCell.parentNode != cell.parentNode){ console.warn("같은 그룹에 있는 셀만 합칠 수 있습니다."); return; }
        cell.colSpan+=tCell.colSpan;
        rowsCells[tCell.__ridx][tCell.__cidx] = cell;
        cell.__ridx = tCell.__ridx;
        cell.__cidx = tCell.__cidx;
      }
      ridx = cell.__ridx;
      cidx = cell.__cidx;

      for(let i1=cell.__ridx,m1=cell.__ridx+cell.rowSpan;i1<m1;i1++){
        for(let i2=cell.__cidx,m2=cell.__cidx+cell.colSpan;i2<m2;i2++){
          if(rowsCells[i1][i2] != cell){
            rowsCells[i1][i2]=cell
          }
        }
      }

      if(this.debug) console.log(rowsCells);
      this.redrawTableWithRowsCells(table,rowsCells)
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
    },
    redrawTableWithRowsCells:function(table,rowsCells){
      let rows = table.rows;
      let cells = null;
      for(let i=rows.length-1,m=0;i>=m;i--){
        rows[i].innerHTML = '';
        cells = rowsCells[i];
        for(let i2=cells.length-1,m2=0;i2>=m2;i2--){
          rows[i].prepend(cells[i2])
        }
        
      }
    }


  }
  return tableControlPanel;
})()