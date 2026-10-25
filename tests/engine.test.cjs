const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
test('browser adapter creates real editable paths from RGBA, with palette and transparency',async()=>{
 const engine=await import('../dist/vendor/vtracer.js');
 engine.init(await fs.readFile(new URL('../dist/vendor/vtracer.wasm',pathToFileURL(__filename))));
 const rgba=new Uint8Array(64*64*4);
 for(let y=8;y<56;y++)for(let x=8;x<56;x++)rgba.set(x<32?[230,80,30,255]:[30,90,60,255],(y*64+x)*4);
 for(const mode of ['spline','polygon','pixel']){
  const svg=engine.vectorize_rgba(rgba,64,64,{hierarchical:'cutout',mode,maxColors:2,filterSpeckle:2,simplify:1.2,pathPrecision:2,optimize:1});
  assert.match(svg,/<svg/);assert.match(svg,/<path/);assert.doesNotMatch(svg,/<image|data:image/);assert.match(svg,/width="64"/);
 }
 const bw=engine.vectorize_rgba(rgba,64,64,{preset:'bw',clustering:'bw',binaryThreshold:128});assert.match(bw,/<path/);
});
test('invalid RGBA input is rejected',async()=>{
 const engine=await import('../dist/vendor/vtracer.js');assert.throws(()=>engine.vectorize_rgba(new Uint8Array(3),64,64,{}));
});
