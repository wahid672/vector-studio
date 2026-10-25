import {init,vectorize_rgba} from './vendor/vtracer.js';
import {prepareRaster} from './preprocess.js';
self.onmessage=async({data})=>{
 try {
  const response=await fetch('./vendor/vtracer.wasm');
  if(!response.ok) throw Error('Mesin konversi tidak dapat dimuat. Muat ulang halaman.');
  init(await response.arrayBuffer());
  self.postMessage({type:'ready'});
  const start=performance.now();
  const cleaned=prepareRaster(new Uint8Array(data.rgba),data.width,data.height,data.cleanup);
  const svg=vectorize_rgba(cleaned.rgba,data.width,data.height,data.options);
  self.postMessage({type:'result',svg,removedPixels:cleaned.removedPixels,elapsed:performance.now()-start});
 }catch(error){self.postMessage({type:'error',message:String(error?.message||error)});}
};
