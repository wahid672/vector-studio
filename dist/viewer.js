export const clampZoom=value=>Math.min(16,Math.max(.1,value));
export function zoomFromWheel(current,delta,mode=0,pageHeight=800){
 const pixels=delta*(mode===1?16:mode===2?pageHeight:1);
 return clampZoom(current*Math.exp(-Math.max(-200,Math.min(200,pixels))*.01));
}

export function installViewer({viewport,stage,artboard,label,getSource,zoomIn,zoomOut,fitButton,fullscreenButton,editor}){
 let zoom=1,gesture=null,frame=0;
 function layout(){
  const source=getSource();if(!source)return;
  const width=viewport.clientWidth,height=viewport.clientHeight;
  const fit=Math.min(Math.max(1,width-80)/source.width,Math.max(1,height-80)/source.height);
  const w=source.width*fit*zoom,h=source.height*fit*zoom;
  const sw=Math.max(width,w+80),sh=Math.max(height,h+80);
  stage.style.width=sw+'px';stage.style.height=sh+'px';
  artboard.style.width=w+'px';artboard.style.height=h+'px';
  artboard.style.left=(sw-w)/2+'px';artboard.style.top=(sh-h)/2+'px';
  label.value=Math.round(zoom*100)+'%';
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
 zoomIn.onclick=()=>setZoom(zoom*1.25);zoomOut.onclick=()=>setZoom(zoom/1.25);
 const fit=()=>{zoom=1;layout();viewport.scrollLeft=0;viewport.scrollTop=0;};
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
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&editor.classList.contains('editor-expanded')){event.preventDefault();exit();}});
 new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(layout);}).observe(viewport);
 return {fit,resize:layout,setZoom};
}
