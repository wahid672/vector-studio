// Edge-aware cleanup before tracing. The original preview is never modified.
export function prepareRaster(input,width,height,level='balanced'){
 if(input.length!==width*height*4)throw Error('Ukuran piksel gambar tidak valid.');
 if(level==='off')return {rgba:input,removedPixels:0};
 const strong=level==='strong',cutoff=strong?48:24;
 const rgba=new Uint8Array(input);let removedPixels=0;
 for(let p=0;p<rgba.length;p+=4){
  if(rgba[p+3]<cutoff){if(rgba[p+3])removedPixels++;rgba.fill(0,p,p+4);}
 }
 // Discard tiny disconnected alpha wisps. Balanced preserves opaque dots/accents.
 const count=width*height,seen=new Uint8Array(count),queue=new Int32Array(count);
 for(let seed=0;seed<count;seed++){
  if(seen[seed]||!rgba[seed*4+3])continue;
  let head=0,tail=1,peak=0;queue[0]=seed;seen[seed]=1;
  while(head<tail){
   const pos=queue[head++],x=pos%width,y=Math.floor(pos/width);
   peak=Math.max(peak,rgba[pos*4+3]);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
    const n=ny*width+nx;
    if(!seen[n]&&rgba[n*4+3]){seen[n]=1;queue[tail++]=n;}
   }
  }
  if(tail<=(strong?9:4)&&peak<192)for(let i=0;i<tail;i++){rgba.fill(0,queue[i]*4,queue[i]*4+4);removedPixels++;}
 }
 // Bilateral-style local smoothing: reject neighbors across strong color/alpha edges.
 const snapshot=rgba.slice(),radius=1,sigma2=strong?576:144;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const p=(y*width+x)*4,a=snapshot[p+3];if(!a)continue;
  let r=0,g=0,b=0,total=0;
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;
   const n=(ny*width+nx)*4,na=snapshot[n+3];if(!na||Math.abs(na-a)>32)continue;
   const dr=snapshot[n]-snapshot[p],dg=snapshot[n+1]-snapshot[p+1],db=snapshot[n+2]-snapshot[p+2];
   const distance=dr*dr+dg*dg+db*db;if(distance>sigma2*9)continue;
   const weight=1/((1+dx*dx+dy*dy)*(1+distance/sigma2));
   r+=snapshot[n]*weight;g+=snapshot[n+1]*weight;b+=snapshot[n+2]*weight;total+=weight;
  }
  rgba[p]=Math.round(r/total);rgba[p+1]=Math.round(g/total);rgba[p+2]=Math.round(b/total);
 }
 return {rgba,removedPixels};
}

// Small, explicit tonal contours prevent the color clusterer from chaining a
// continuous ramp into one average region. This is not a global palette cap.
// Cap the adjustment at two 8-bit channel units, regardless of cleanup strength.
export function preserveTonalContours(input){
 const rgba=input.slice();
 for(let p=0;p<rgba.length;p+=4){
  if(!rgba[p+3])continue;
  for(let c=0;c<3;c++)rgba[p+c]=Math.min(255,Math.round(rgba[p+c]/4)*4);
 }
 return rgba;
}
