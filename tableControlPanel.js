'use strict';

const tableControlPanel = (function(){
  let getSelectionStart = function() {
    var node = document.getSelection().anchorNode;
    if(!node) return document.body;
    return (node.nodeType == 3 ? node.parentNode : node);
 }
  let searchTd = (event)=>{
    let node = event.target;
    // console.log(node);
    // var node = getSelectionStart();
    tableControlPanel.show(node);
  }
  let tableControlPanel = {
    debug:false,
    activedTcpp:null,
    addedEvent:false,
    addEvent:function(w){
      if(this.addedEvent){return false;}
      // w.addEventListener('focus',searchTd);
      w.addEventListener('click',searchTd);
      this.addedEvent = !this.addedEvent;
    },
    appendTcpp:function(node){
      let tcpp ;
      let w = node.ownerDocument.defaultView;
      let d = w.document
      if(w.__tcpp){
        if(this.debug) console.log('이미 tcp-panel이 생성되어있음.');
        tcpp = w.__tcpp;
      }else{
        tcpp = d.createElement('div');
        tcpp.className = 'tcp-panel';
        
        let insertRowUp = d.createElement('button');
        insertRowUp.className = 'tcp-panel-insert-row-up';
        insertRowUp.onclick = function(){ tableControlPanel.insertRow(0)};
        tcpp.appendChild(insertRowUp);
        let insertRowRight = d.createElement('button');
        insertRowRight.className = 'tcp-panel-insert-row-right';
        tcpp.appendChild(insertRowRight);
        let insertRowDown = d.createElement('button');
        insertRowDown.onclick = function(){ tableControlPanel.insertRow(1)};
        insertRowDown.className = 'tcp-panel-insert-row-down';
        tcpp.appendChild(insertRowDown);
        let insertRowleft = d.createElement('button');
        insertRowleft.className = 'tcp-panel-insert-row-left';
        tcpp.appendChild(insertRowleft);

        w.document.body.appendChild(tcpp);
        w.__tcpp = tcpp;
      }
      tcpp.__targetNode = node;
      let bcr = node.getBoundingClientRect();
      d.body.classList.add('tcp-on');
      tcpp.style.left=bcr.left+'px'
      tcpp.style.top=bcr.top+'px'
      tcpp.style.width=bcr.width+'px'
      tcpp.style.height=bcr.height+'px'
      this.activedTcpp = tcpp;
    },
    show:function(node){
      if(node.closest('.tcp-panel')){return}
      node = node.closest('td,th');
      if(!node || (node.tagName!='TD' && node.tagName!='TH')){
        if(this.debug) console.log('TD,TH만 동작');
        this.hide();
        return false;
      }
      if(!node.closest('.tcp-enabled')){
        if(this.debug) console.log('.tcp-enabled 속에서만 동작');
        this.hide();
        return false;
      }
      console.log("show 동작");
      this.appendTcpp(node);
    },
    hide:function(){
      if(this.activedTcpp){
        let w = this.activedTcpp.ownerDocument.defaultView;
        let d = w.document
        d.body.classList.remove('tcp-on');
      }
      window.document.body.classList.remove('tcp-on');
    },
    insertRow:function(isDown){
      if(!this.activedTcpp){
        if(this.debug) console.log('activedTcpp가 있어야만 동작합니다.');
        return false;
      }
      if(!this.activedTcpp.__targetNode){
        if(this.debug) console.log('activedTcpp.__targetNode가 있어야만 동작합니다.');
        return false;
      }
      let node = this.activedTcpp.__targetNode;
      let table = node.closest('table');
      if(!table){
        if(this.debug) console.log('table 속 td,th만 동작합니다.');
        return false;
      }
      let tr = node.parentNode;
      let tbody = tr.parentNode;
      let new_tr = tbody.insertRow(tr.rowIndex+isDown);
      tr.querySelectorAll('td,th').forEach(el => {
        new_tr.appendChild(el.cloneNode(false));
      });
      this.show(node);
      
    },


  }
  return tableControlPanel;
})()