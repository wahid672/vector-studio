const {test}=require('node:test');
const assert=require('node:assert/strict');
test('pinch wheel normalizes deltas and clamps zoom',async()=>{
 const {zoomFromWheel}=await import('../dist/viewer.js');
 assert.ok(zoomFromWheel(1,-20)>1);assert.ok(zoomFromWheel(1,20)<1);
 assert.equal(zoomFromWheel(1,1,1),zoomFromWheel(1,16,0));
 assert.equal(zoomFromWheel(16,-200),16);assert.equal(zoomFromWheel(.1,200),.1);
});
test('viewer captures pinch without intercepting ordinary scroll, anchors zoom, and restores expanded editor',async()=>{
 const {installViewer}=await import('../dist/viewer.js');
 const handlers={};const docHandlers={};
 const classes=()=>{const set=new Set();return {contains:k=>set.has(k),add:k=>set.add(k),remove:k=>set.delete(k),toggle:(k,on)=>on?set.add(k):set.delete(k)};};
 const artboard={style:{},getBoundingClientRect:()=>({left:Number.parseFloat(artboard.style.left)-viewport.scrollLeft,top:Number.parseFloat(artboard.style.top)-viewport.scrollTop,width:Number.parseFloat(artboard.style.width),height:Number.parseFloat(artboard.style.height)})};
 const viewport={classList:classes(),clientWidth:800,clientHeight:600,scrollLeft:0,scrollTop:0,focus(){},setPointerCapture(){},releasePointerCapture(){},matches:()=>true,getBoundingClientRect:()=>({left:0,top:0}),addEventListener:(name,fn,options)=>{handlers[name]={fn,options};}};
 const editor={classList:classes()};const button={setAttribute(k,v){this[k]=v;},querySelector:()=>({textContent:''}),focus(){}};
 const handButton={setAttribute(k,v){this[k]=v;}};
 const originals={document:global.document,ResizeObserver:global.ResizeObserver,requestAnimationFrame:global.requestAnimationFrame,cancelAnimationFrame:global.cancelAnimationFrame};
 try{
  global.document={body:{classList:classes()},fullscreenEnabled:false,fullscreenElement:null,addEventListener:(name,fn)=>docHandlers[name]=fn};
  global.ResizeObserver=class{observe(){}};global.requestAnimationFrame=fn=>{fn();return 1;};global.cancelAnimationFrame=()=>{};
  const viewer=installViewer({viewport,stage:{style:{}},artboard,label:{},getSource:()=>({width:640,height:640}),zoomIn:{},zoomOut:{},fitButton:{},fullscreenButton:button,handButton,editor});
  viewer.fit();const before=artboard.getBoundingClientRect();const point={x:450,y:280};const u=(point.x-before.left)/before.width,v=(point.y-before.top)/before.height;
  let prevented=false;handlers.wheel.fn({ctrlKey:false,preventDefault:()=>prevented=true});assert.equal(prevented,false);
  handlers.wheel.fn({ctrlKey:true,deltaY:-40,deltaMode:0,clientX:point.x,clientY:point.y,preventDefault:()=>prevented=true});
  assert.equal(prevented,true);assert.equal(handlers.wheel.options.passive,false);
  const after=artboard.getBoundingClientRect();assert.ok(after.width>before.width);
  assert.ok(Math.abs(after.left+u*after.width-point.x)<.01);assert.ok(Math.abs(after.top+v*after.height-point.y)<.01);
  viewer.fit();assert.ok(viewport.scrollLeft>0&&viewport.scrollTop>0,'Fit must leave room to pan both ways');
  const startLeft=viewport.scrollLeft,startTop=viewport.scrollTop;
  handButton.onclick();assert.equal(handButton['aria-pressed'],'true');
  const pointer={pointerId:1,button:0,clientX:300,clientY:200,preventDefault(){},stopPropagation(){}};
  handlers.pointerdown.fn(pointer);handlers.pointermove.fn({...pointer,clientX:340,clientY:230});
  assert.equal(viewport.scrollLeft,startLeft-40);assert.equal(viewport.scrollTop,startTop-30);
  handlers.pointercancel.fn(pointer);assert.equal(viewport.classList.contains('hand-dragging'),false);
  handButton.onclick();assert.equal(handButton['aria-pressed'],'false');
  docHandlers.keydown({code:'Space',key:' ',preventDefault(){}});assert.equal(viewport.classList.contains('hand-active'),true);
  docHandlers.keyup({code:'Space'});assert.equal(viewport.classList.contains('hand-active'),false);
  docHandlers.keydown({code:'Space',key:' ',target:{closest:()=>true},preventDefault(){throw Error('Do not intercept typing');}});
  assert.equal(viewport.classList.contains('hand-active'),false);
  await button.onclick();assert.equal(editor.classList.contains('editor-expanded'),true);assert.equal(button['aria-pressed'],'true');
  docHandlers.keydown({key:'Escape',preventDefault(){}});assert.equal(editor.classList.contains('editor-expanded'),false);
 }finally{Object.assign(global,originals);}
});
