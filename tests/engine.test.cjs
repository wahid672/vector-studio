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

test('unlimited color mode preserves more than 32 colors; limited and custom modes constrain the same image',async()=>{
 const engine=await import('../dist/vendor/vtracer.js');
 const {buildOptions}=await import('../dist/settings.js');
 const width=96,rgba=new Uint8Array(width*width*4);
 for(let y=0;y<width;y++)for(let x=0;x<width;x++){
  const n=Math.floor(y/12)*8+Math.floor(x/12);
  rgba.set([(n%4)*80+8,(Math.floor(n/4)%4)*80+8,Math.floor(n/16)*80+8,255],(y*width+x)*4);
 }
 const base={preset:'logo',quality:'high',detail:'high',simplify:0,speckle:0,mode:'spline',colors:8,threshold:128};
 const colors=svg=>new Set([...svg.matchAll(/fill="(#[0-9a-f]{6})"/gi)].map(match=>match[1].toUpperCase()));
 const unlimited=buildOptions({...base,colorMode:'unlimited'});
 assert.equal(Object.hasOwn(unlimited,'maxColors'),false);
 assert.equal(Object.hasOwn(unlimited,'palette'),false);
 const full=colors(engine.vectorize_rgba(rgba,width,width,unlimited));
 assert.ok(full.size>32,`Expected more than 32 output colors, got ${full.size}`);
 const limited=colors(engine.vectorize_rgba(rgba,width,width,buildOptions({...base,colorMode:'limited'})));
 assert.ok(limited.size<=8 && limited.size>1);
 const custom=colors(engine.vectorize_rgba(rgba,width,width,buildOptions({...base,colorMode:'custom',palette:'#112233, #EECC99'})));
 assert.ok(custom.size>0);
 for(const color of custom)assert.ok(['#112233','#EECC99'].includes(color));
 const bw=buildOptions({...base,preset:'bw',colorMode:'custom',palette:'invalid'});
 assert.equal(Object.hasOwn(bw,'palette'),false);assert.equal(bw.clustering,'bw');
});

test('invalid custom palettes fail before processing',async()=>{
 const {parsePalette}=await import('../dist/settings.js');
 assert.throws(()=>parsePalette('red, #12'),/HEX/);
 assert.throws(()=>parsePalette(''),/HEX/);
 assert.deepEqual(parsePalette('#aabbcc, #AABBCC\n#112233'),['#AABBCC','#112233']);
});

test('cleanup pipeline reduces noisy flat-color fragmentation while retaining real vector paths',async()=>{
 const engine=await import('../dist/vendor/vtracer.js');
 const {prepareRaster,preserveTonalContours}=await import('../dist/preprocess.js');
 const {buildOptions}=await import('../dist/settings.js');
 const w=80,a=new Uint8Array(w*w*4);
 for(let y=8;y<72;y++)for(let x=8;x<72;x++){
  const n=(x*17+y*11)%13-6;
  a.set(x<40?[120+n,90+n,70+n,255]:[30+n,40+n,50+n,255],(y*w+x)*4);
 }
 a.set([100,100,100,12],(2*w+2)*4);
 const old=engine.vectorize_rgba(a,w,w,{mode:'spline',hierarchical:'cutout',colorPrecision:8,layerDifference:4,filterSpeckle:2,simplify:1.2,optimize:1});
 const cleaned=prepareRaster(a,w,w,'balanced');
 const settings={preset:'logo',quality:'high',detail:'medium',simplify:.5,speckle:1,mode:'spline',cleanup:'balanced',layering:'cutout',colorMode:'unlimited'};
 const svg=engine.vectorize_rgba(preserveTonalContours(cleaned.rgba),w,w,buildOptions(settings));
 const paths=s=>(s.match(/<path/g)||[]).length;
 assert.ok(paths(svg)>0&&paths(svg)<paths(old)/2,`Expected fewer noise regions: ${paths(old)} → ${paths(svg)}`);
 assert.doesNotMatch(svg,/<image|data:image/);assert.ok(cleaned.removedPixels>0);
});
