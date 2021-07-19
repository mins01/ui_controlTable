'use strict';

const tableControlPanel = (function(){
  let getSelectionStart = function() {
    var node = document.getSelection().anchorNode;
    if(!node) return document.body;
    return (node.cellType == 3 ? node.parentNode : node);
 }
  let searchTd = (event)=>{
    let node = event.target;
    tableControlPanel.show(node);
  }
  let redraw = (event)=>{
    tableControlPanel.redraw();
  }
  let tableControlPanel = {
    debug:false,
    activedTcpcs:null,
    addedEvent:false,
    lastCell:null,
    addEvent:function(w){
      if(this.addedEvent){return false;}
      // w.addEventListener('focus',searchTd);
      w.addEventListener('click',searchTd);
      w.addEventListener('scroll',redraw);
      w.addEventListener('resize',redraw);
      this.addedEvent = !this.addedEvent;
    },
    cbEvent:function(desc,event){
      if(this.debug){ console.log('cbEvent',desc,this.lastCell,event)}
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
          <div class="tcp-panel"  title="column control">\
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
            <button class="tcp-btn tcp-btn-split" title="split" ></button>\
            <button class="tcp-btn tcp-btn-resize" title="resize" ></button>\
            <div  class="tcp-deco"></div>\
          </div>\
        </div>\
        ';
      //</div>';
      let tcpcs = d.createElement('div');
      tcpcs.className='tcp-controls tcpcs';
      tcpcs.innerHTML = html;
      tcpcs.querySelector('.tcp-btn-insertRow-0').onclick = function(event){ tableControlPanel.insertRow(0); tableControlPanel.cbEvent('insertRow-0',event); };
      tcpcs.querySelector('.tcp-btn-insertRow-1').onclick = function(event){ tableControlPanel.insertRow(1); tableControlPanel.cbEvent('insertRow-1',event); };
      tcpcs.querySelector('.tcp-btn-deleteRow').onclick = function(event){ tableControlPanel.deleteRow(); tableControlPanel.cbEvent('deleteRow',event); };
      
      tcpcs.querySelector('.tcp-btn-insertCell-0').onclick = function(event){ tableControlPanel.insertCell(0); tableControlPanel.cbEvent('insertCell-0',event); };
      tcpcs.querySelector('.tcp-btn-insertCell-1').onclick = function(event){ tableControlPanel.insertCell(1); tableControlPanel.cbEvent('insertCell-1',event); };
      tcpcs.querySelector('.tcp-btn-deleteCell').onclick = function(event){ tableControlPanel.deleteCell(); tableControlPanel.cbEvent('deleteCell',event); };
      
      tcpcs.querySelector('.tcp-btn-merge-up').onclick = function(event){ tableControlPanel.mergeCell(-1,0); tableControlPanel.cbEvent('merge-up',event); };
      tcpcs.querySelector('.tcp-btn-merge-down').onclick = function(event){ tableControlPanel.mergeCell(1,0); tableControlPanel.cbEvent('merge-down',event); };
      tcpcs.querySelector('.tcp-btn-merge-left').onclick = function(event){ tableControlPanel.mergeCell(0,-1); tableControlPanel.cbEvent('merge-left',event); };
      tcpcs.querySelector('.tcp-btn-merge-right').onclick = function(event){ tableControlPanel.mergeCell(0,1); tableControlPanel.cbEvent('merge-right',event); };
      tcpcs.querySelector('.tcp-btn-split').onclick = function(event){ tableControlPanel.splitCellAll(); tableControlPanel.cbEvent('split',event); };

      // tcpcs.querySelector('.tcp-resizeHeightCell').onclick = function(){  console.log('x');};
      // resize 동작 처리
      let x,y;
      let draging = false;
      let w_org,h_org
      tcpcs.querySelector('.tcp-btn-resize').addEventListener('touchstart',function(event){ 
        event.preventDefault();event.stopPropagation();
        return false;
      })
      
      tcpcs.querySelector('.tcp-btn-resize').addEventListener('pointerdown',function(event){ 
        draging = true;
        event.preventDefault();event.stopPropagation();
        let cell = tableControlPanel.activedTcpcs.cell;
        w_org = (cell.style.width?parseFloat(cell.style.width):cell.getBoundingClientRect()['width'])
        h_org = (cell.style.height?parseFloat(cell.style.height):cell.getBoundingClientRect()['height']);
        // cell.style.width = ((cell.style.width?parseFloat(cell.style.width):cell.getBoundingClientRect()['width'])+w)+'px'
        // cell.style.height = ((cell.style.height?parseFloat(cell.style.height):cell.getBoundingClientRect()['height'])+h)+'px'
        x = event.x;
        y = event.y;
      });
      d.addEventListener('pointermove',function(event){ 
        if(!draging){return false;}
        event.preventDefault();event.stopPropagation(); 
        let x2 = event.x;
        let y2 = event.y;
        // tableControlPanel.resizeByCell(x2-x,y2-y);
        tableControlPanel.resizeCell(w_org+x2-x,h_org+y2-y);
        // x=x2;
        // y=y2;
      });
      d.addEventListener('pointerup',function(event){
        if(draging){
          draging = false;
          tableControlPanel.cbEvent('resize',event);
          event.preventDefault();event.stopPropagation(); 
        }
      })


//tcp-resizeHeightCell
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

      this.activedTcpcs.setAttribute('data-cell-ridx',cell.__ridx)
      this.activedTcpcs.setAttribute('data-cell-cidx',cell.__cidx)
      this.activedTcpcs.setAttribute('data-cell-rpos',cell.__ridx==0?'first':(cell.__ridx==this.activedTcpcs.rowsCells.length-1?'last':''))
      this.activedTcpcs.setAttribute('data-cell-cpos',cell.__cidx==0?'first':(cell.__cidx==this.activedTcpcs.rowsCells[0].length-1?'last':''))
      this.activedTcpcs.setAttribute('data-cell-merged',cell.colSpan+cell.rowSpan>2?'merged':'')

      return tcpcs;
    },
    redraw:function(){
      if(this.activedTcpcs && this.activedTcpcs.cell && this.activedTcpcs.d){
        if(this.activedTcpcs.d.body.classList.contains('tcp-on')){
          this._show(this.activedTcpcs.cell)
        }
      }
    },
    show:function(node){
      let r = this._show(node);
      if(r) tableControlPanel.cbEvent('show',null);
      return r;
    },
    _show:function(node){
      if(node.closest('.tcp-controls')){return}
      let cell = node.closest('td,th');
      if(!cell || (cell.tagName!='TD' && cell.tagName!='TH')){
        if(this.debug) console.log('TD,TH만 동작');
        this.hide();
        return false;
      }
      this.lastCell = cell;
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
      return true;

    },
    hide:function(){
      let r = this._hide();
      if(r) tableControlPanel.cbEvent('hide',null);
      return r;
    },
    _hide:function(){
      let r = 0;
      if(this.activedTcpcs && this.activedTcpcs.d){
        let d = this.activedTcpcs.d;
        if(d.body.classList.contains('tcp-on')){
          d.body.classList.remove('tcp-on');
          r++;
        }
      }
      if(window.document.body.classList.contains('tcp-on')){
        window.document.body.classList.remove('tcp-on');
        r++;
      }
      return r>0;
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
      this._show(cell);
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
      this._show(cell);
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
          // console.log(ridx,cidx);
        }
      })
      // if(this.debug) console.log(rowsCells);
      this.redrawTableWithRowsCells(table,rowsCells)
      this._show(cell);
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
      this._show(cell);
    },
    rangeMergeCell(r1,c1,r2,c2){
      let rowsCells = this.activedTcpcs.rowsCells;
      let table = this.activedTcpcs.table;
      let cell00 = rowsCells[r1][c1];
      let cell90 = rowsCells[r2][c1];
      let cell09 = rowsCells[r1][c2];
      let cell99 = rowsCells[r2][c2];
      let cell = cell00;

      if(cell00.__ridx != cell09.__ridx || cell90.__ridx+cell90.rowSpan != cell99.__ridx+cell99.rowSpan
        || cell00.__cidx != cell90.__cidx || cell09.__cidx+cell09.colSpan != cell99.__cidx+cell99.colSpan)
        {
          console.log(cell00,cell09);
          console.log(cell90,cell99);
          console.log(cell00.__ridx , cell09.__ridx , cell90.__ridx+cell90.rowSpan , cell99.__ridx+cell99.rowSpan);
          console.log(cell00.__cidx , cell90.__cidx , cell09.__cidx+cell09.colSpan , cell99.__cidx+cell99.colSpan);
          console.warn("셀의 모양이 달라 합칠 수 없습니다."); return;
        }
      let t = cell00.parentNode.parentNode;
      if(t != cell09.parentNode.parentNode || t != cell09.parentNode.parentNode || t != cell90.parentNode.parentNode || t != cell99.parentNode.parentNode){
        console.warn("같은 그룹(tbody 등) 속의 셀만 합칠 수 있습니다."); return;
      }

      
      let nr1 = cell00.__ridx;
      let nc1 = cell00.__cidx;
      let nr2 = cell99.__ridx+cell99.rowSpan-1;
      let nc2 = cell99.__cidx+cell99.colSpan-1;

      cell.__ridx = nr1;
      cell.rowSpan = nr2-nr1+1;
      cell.__cidx = nc1;
      cell.colSpan = nc2-nc1+1;
      rowsCells[nr1][nc1] = cell;
      
      for(let i1=cell.__ridx,m1=cell.__ridx+cell.rowSpan;i1<m1;i1++){
        for(let i2=cell.__cidx,m2=cell.__cidx+cell.colSpan;i2<m2;i2++){
          if(rowsCells[i1][i2] != cell){
            rowsCells[i1][i2]=cell
          }
        }
      }

      this.redrawTableWithRowsCells(table,rowsCells)
      this._show(cell);

      
    },
    mergeCell(isDown,isRight){
      if(!this.activedTcpcs){ if(this.debug) console.log('activedTcpcs가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.cell){ if(this.debug) console.log('activedTcpcs.cell가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let cell = this.activedTcpcs.cell;
      if(isDown == 1){
        this.rangeMergeCell(cell.__ridx,cell.__cidx,cell.__ridx+cell.rowSpan-1+1,cell.__cidx+cell.colSpan-1);
      }else if(isDown == -1){
        this.rangeMergeCell(cell.__ridx-1,cell.__cidx,cell.__ridx+cell.rowSpan-1,cell.__cidx+cell.colSpan-1);
      }
      if(isRight == 1){
        this.rangeMergeCell(cell.__ridx,cell.__cidx,cell.__ridx+cell.rowSpan-1,cell.__cidx+cell.colSpan-1+1);
      }else if(isRight == -1){
        this.rangeMergeCell(cell.__ridx,cell.__cidx-1,cell.__ridx+cell.rowSpan-1,cell.__cidx+cell.colSpan-1);
      }
    },
    splitCellAll:function(){
      if(!this.activedTcpcs){ if(this.debug) console.log('activedTcpcs가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.cell){ if(this.debug) console.log('activedTcpcs.cell가 있어야만 동작합니다.'); return false; }
      if(!this.activedTcpcs.table){ if(this.debug) console.log('table 속 td,th만 동작합니다.'); return false; }
      let cell = this.activedTcpcs.cell;
      let rowsCells = this.activedTcpcs.rowsCells;
      let table = this.activedTcpcs.table;

      for(let i1=cell.__ridx,m1=cell.__ridx+cell.rowSpan;i1<m1;i1++){
        for(let i2=cell.__cidx,m2=cell.__cidx+cell.colSpan;i2<m2;i2++){
          if(i1==cell.__ridx && i2==cell.__cidx){
            continue;
          }
          let new_td = document.createElement('td');
          new_td.innerHTML = '&nbsp;';
          rowsCells[i1][i2] = new_td;
        }
      }
      cell.colSpan=1;
      cell.rowSpan=1;
      if(this.debug) console.log(rowsCells);
      this.redrawTableWithRowsCells(table,rowsCells)
      this._show(cell);
    },
    resizeByCell:function(w,h){
      if(this.debug) console.log('resizeByCell',w,h);
      let cell = this.activedTcpcs.cell;
      cell.style.width = ((cell.style.width?parseFloat(cell.style.width):cell.getBoundingClientRect()['width'])+w)+'px'
      cell.style.height = ((cell.style.height?parseFloat(cell.style.height):cell.getBoundingClientRect()['height'])+h)+'px'
      this._show(cell);
    },
    resizeCell:function(w,h){
      if(this.debug) console.log('resizeCell',w,h);
      let cell = this.activedTcpcs.cell;
      cell.style.width = w+'px'
      cell.style.height = h+'px'
      this._show(cell);
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
    getCellsForRowsCells:function(rowsCells){
      let new_cells = [];
      rowsCells.forEach(cells => {
        new_cells = new_cells.concat(cells);
      });
      return new_cells;
    },
    getRangedRowsCells:function(rowsCells,r1,c1,r2,c2){
      let rangedRowsCells = []
      for(let i1=r1,m1=r2;i1<=m1;i1++){
        let row = [];
        rangedRowsCells.push(row)
        for(let i2=c1,m2=c2;i2<=m2;i2++){
          row.push(rowsCells[i1][i2]);
        }
      }
      return rangedRowsCells;
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