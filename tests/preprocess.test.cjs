const {test}=require('node:test');
const assert=require('node:assert/strict');
test('balanced cleanup removes weak alpha dust, preserves opaque accents and soft main edges, and leaves source untouched',async()=>{
 const {prepareRaster}=await import('../dist/preprocess.js');
 const w=40,a=new Uint8Array(w*w*4),put=(x,y,color)=>a.set(color,(y*w+x)*4);
 for(let y=12;y<32;y++)for(let x=12;x<32;x++)put(x,y,[240,240,240,255]);
 for(let y=12;y<32;y++)put(11,y,[240,240,240,128]);
 put(1,1,[255,255,255,12]);put(4,2,[140,140,140,120]);put(5,2,[140,140,140,120]);put(4,6,[0,0,0,255]);
 const original=a.slice(),balanced=prepareRaster(a,w,w,'balanced');
 assert.deepEqual(a,original);assert.equal(balanced.removedPixels,3);
 assert.equal(balanced.rgba[(1*w+1)*4+3],0);assert.equal(balanced.rgba[(2*w+4)*4+3],0);
 assert.equal(balanced.rgba[(6*w+4)*4+3],255);assert.equal(balanced.rgba[(20*w+11)*4+3],128);
 assert.equal(prepareRaster(a,w,w,'strong').rgba[(6*w+4)*4+3],255);
 assert.deepEqual(prepareRaster(a,w,w,'off').rgba,original);
});
test('noise smoothing reduces color variation without blurring a strong black/white boundary',async()=>{
 const {prepareRaster}=await import('../dist/preprocess.js');
 const w=40,h=20,a=new Uint8Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const noise=((x*13+y*7)%13),v=x<20?noise:242+noise;a.set([v,v,v,255],(y*w+x)*4);
 }
 const b=prepareRaster(a,w,h,'balanced').rgba;
 const spread=data=>{let mean=0,sum=0;for(let y=3;y<17;y++)for(let x=3;x<17;x++){const v=data[(y*w+x)*4];mean+=v;sum+=v*v;}return sum/196-(mean/196)**2;};
 assert.ok(spread(b)<spread(a));
 assert.ok(b[(10*w+20)*4]-b[(10*w+19)*4]>220);
});
