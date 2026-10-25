export const clampZoom=value=>Math.min(16,Math.max(.1,value));
export function zoomFromWheel(current,delta,mode=0,pageHeight=800){
 const pixels=delta*(mode===1?16:mode===2?pageHeight:1);
 return clampZoom(current*Math.exp(-Math.max(-200,Math.min(200,pixels))*.01));
}

export function installViewer({viewport,stage,artboard,label,getSource,zoomIn,zoomOut,fitButton,fullscreenButton,handButton,editor}){
 let zoom=1,gesture=null,frame=0,hand=false,space=false,drag=null,lastWidth=0,lastHeight=0;
 function layout(){
  const source=getSource();if(!source)return;
  const width=viewport.clientWidth,height=viewport.clientHeight;
  const fit=Math.min(Math.max(1,width-80)/source.width,Math.max(1,height-80)/source.height);
  const w=source.width*fit*zoom,h=source.height*fit*zoom;
  // Leave a pan margin even at fit-to-canvas, so Hand can move an unzoomed image.
  const sw=Math.max(width,w+80)+width,sh=Math.max(height,h+80)+height;
  stage.style.width=sw+'px';stage.style.height=sh+'px';
  artboard.style.width=w+'px';artboard.style.height=h+'px';
  artboard.style.left=(sw-w)/2+'px';artboard.style.top=(sh-h)/2+'px';
  label.value=Math.round(zoom*100)+'%';
  if(width!==lastWidth||height!==lastHeight){viewport.scrollLeft=(sw-width)/2;viewport.scrollTop=(sh-height)/2;}
  lastWidth=width;lastHeight=height;
 }
 function setZoom(value,point){
  const rect=viewport.getBoundingClientRect(),old=artboard.getBoundingClientRect();
  const p=point||{x:rect.left+viewport.clientWidth/2,y:rect.top+viewport.clientHeight/2};
  const u=old.width?(p.x-old.left)/old.width:.5,v=old.height?(p.y-old.top)/old.height:.5;
  zoom=clampZoom(value);layout();
  viewport.scrollLeft=parseFloat(artboard.style.left)+u*parseFloat(artboard.style.width)-(p.x-rect.left);
  viewport.scrollTop=parseFloat(artboard.style.top)+v*parseFloat(artboard.style.height)-(p.y-rect.top);
 }
 viewport.addEventListener('wheel',event=>{
  if(!event.ctrlKey||gesture)return;
  event.preventDefault();
  setZoom(zoomFromWheel(zoom,event.deltaY,event.deltaMode,viewport.clientHeight),{x:event.clientX,y:event.clientY});
 },{passive:false});
 // Safari exposes trackpad pinch through GestureEvent instead of ctrl+wheel.
 viewport.addEventListener('gesturestart',event=>{event.preventDefault();gesture={zoom};},{passive:false});
 viewport.addEventListener('gesturechange',event=>{event.preventDefault();if(gesture)setZoom(gesture.zoom*event.scale,{x:event.clientX,y:event.clientY});},{passive:false});
 viewport.addEventListener('gestureend',event=>{event.preventDefault();gesture=null;},{passive:false});
 function syncHand(){
  viewport.classList.toggle('hand-active',hand||space);
  viewport.classList.toggle('hand-dragging',Boolean(drag));
  handButton?.setAttribute('aria-pressed',String(hand));
 }
 if(handButton)handButton.onclick=()=>{hand=!hand;syncHand();viewport.focus({preventScroll:true});};
 function endDrag(){
  if(drag){try{viewport.releasePointerCapture(drag.id);}catch{}drag=null;}
  syncHand();
 }
 viewport.addEventListener('pointerdown',event=>{
  if(drag||!getSource()||(!hand&&!space&&event.button!==1)||![0,1].includes(event.button))return;
  event.preventDefault();event.stopPropagation();
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
  viewport.focus({preventScroll:true});viewport.setPointerCapture(event.pointerId);syncHand();
 },{capture:true});
 viewport.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  event.preventDefault();viewport.scrollLeft=drag.left-(event.clientX-drag.x);viewport.scrollTop=drag.top-(event.clientY-drag.y);
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(name,event=>{if(drag&&event.pointerId===drag.id)endDrag();});
 viewport.addEventListener('dragstart',event=>{if(hand||space||drag)event.preventDefault();});
 const editable=event=>event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
 const insideEditor=()=>viewport.matches?.(':hover')||editor.contains?.(document.activeElement);
 document.addEventListener('keyup',event=>{if(event.code==='Space'||event.key===' '){space=false;syncHand();}});
 globalThis.addEventListener?.('blur',()=>{space=false;endDrag();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){space=false;endDrag();}});
 zoomIn.onclick=()=>setZoom(zoom*1.25);zoomOut.onclick=()=>setZoom(zoom/1.25);
 const fit=()=>{zoom=1;layout();viewport.scrollLeft=(parseFloat(stage.style.width)-viewport.clientWidth)/2;viewport.scrollTop=(parseFloat(stage.style.height)-viewport.clientHeight)/2;};
 fitButton.onclick=fit;
 const expanded=()=>document.fullscreenElement===editor||editor.classList.contains('editor-expanded');
 function syncFullscreen(){
  const open=expanded();document.body.classList.toggle('editor-open',open);
  fullscreenButton.setAttribute('aria-pressed',String(open));
  fullscreenButton.setAttribute('aria-label',open?'Keluar layar penuh editor':'Layar penuh editor');
  fullscreenButton.title=open?'Keluar layar penuh (Esc)':'Layar penuh editor';
  fullscreenButton.querySelector('span').textContent=open?'Keluar':'Layar penuh';
  cancelAnimationFrame(frame);frame=requestAnimationFrame(layout);
 }
 async function exit(){
  if(document.fullscreenElement===editor)await document.exitFullscreen();
  editor.classList.remove('editor-expanded');syncFullscreen();fullscreenButton.focus();
 }
 fullscreenButton.onclick=async()=>{
  if(expanded()){await exit();return;}
  try{
   if(editor.requestFullscreen&&document.fullscreenEnabled)await editor.requestFullscreen();
   else editor.classList.add('editor-expanded');
  }catch{editor.classList.add('editor-expanded');}
  syncFullscreen();
 };
 document.addEventListener('fullscreenchange',syncFullscreen);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&editor.classList.contains('editor-expanded')){event.preventDefault();exit();return;}
  if((editable(event)&&!viewport.contains?.(event.target))||!insideEditor())return;
  if(event.code==='Space'||event.key===' '){event.preventDefault();space=true;syncHand();}
  if(event.key?.toLowerCase()==='h'&&!event.repeat){event.preventDefault();hand=!hand;syncHand();}
 });
 new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(layout);}).observe(viewport);
 return {fit,resize:layout,setZoom};
}
