const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const {Resvg}=require('@resvg/resvg-js');
let engine,prepareRaster,preserveTonalContours,buildOptions,imagePresets;
before(async()=>{
 engine=await import('../dist/vendor/vtracer.js');
 engine.init(await fs.readFile(new URL('../dist/vendor/vtracer.wasm',pathToFileURL(__filename))));
 ({prepareRaster,preserveTonalContours}=await import('../dist/preprocess.js'));
 ({buildOptions,imagePresets}=await import('../dist/settings.js'));
});
function fixture(){
 const width=128,height=96,rgba=new Uint8Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const r=110+Math.round(x*.65+y*.2);
  rgba.set(y<22?[35+(x%9<3?18:0),30,33,255]:[r,r-45,r-68,255],(y*width+x)*4);
 }
 for(const left of [26,80]){
  for(let y=40;y<50;y++)for(let x=left;x<left+16;x++)rgba.set([30,25,25,255],(y*width+x)*4);
  for(let y=42;y<46;y++)for(let x=left+4;x<left+10;x++)rgba.set([250,250,250,255],(y*width+x)*4);
 }
 return {width,height,rgba};
}
function measure(source,pixels,width){
 let error=0,n=0,dark=0,totalDark=0;
 for(let y=30;y<86;y++)for(let x=10;x<118;x++){
  const p=(y*width+x)*4;if(source[p]<80||source[p]>235)continue;
  for(let c=0;c<3;c++){error+=Math.abs(pixels[p+c]-source[p+c]);n++;}
 }
 for(let y=4;y<18;y++)for(let x=4;x<124;x++){totalDark++;if(pixels[(y*width+x)*4]<85)dark++;}
 return {mae:error/n,contrast:pixels[(70*width+108)*4]-pixels[(70*width+20)*4],hairRetention:dark/totalDark,highlight:pixels[(43*width+31)*4]};
}
test('default tracing retains skin-tone contrast, dark texture, and small white highlights after cleanup',()=>{
 const {width,height,rgba}=fixture();
 const bad=engine.vectorize_rgba(rgba,width,height,{hierarchical:'stacked',colorPrecision:6,layerDifference:16,filterSpeckle:4,mode:'spline',simplify:.8,optimize:1});
 const old=measure(rgba,new Resvg(bad,{font:{loadSystemFonts:false}}).render().pixels,width);
 assert.ok(old.contrast<10,'Fixture must expose the previous flattened-gradient regression');
 for(const cleanup of ['balanced','strong']){
  const cleaned=prepareRaster(rgba,width,height,cleanup);
  const options=buildOptions({...imagePresets.logo,preset:'logo',colorMode:'unlimited',cleanup});
  const svg=engine.vectorize_rgba(preserveTonalContours(cleaned.rgba),width,height,options);
  const actual=measure(rgba,new Resvg(svg,{font:{loadSystemFonts:false}}).render().pixels,width);
  assert.ok(actual.mae<7,`${cleanup}: tonal error ${actual.mae}`);
  assert.ok(actual.contrast>=45,`${cleanup}: contrast collapsed to ${actual.contrast}`);
  assert.ok(actual.hairRetention>.95,`${cleanup}: dark detail disappeared`);
  assert.ok(actual.highlight>200,`${cleanup}: small highlight disappeared`);
 }
});
