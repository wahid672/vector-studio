import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('.qa',{recursive:true});
const w=128,h=128,row=w*3,pixels=row*h,b=Buffer.alloc(54+pixels);
b.write('BM');b.writeUInt32LE(b.length,2);b.writeUInt32LE(54,10);b.writeUInt32LE(40,14);b.writeInt32LE(w,18);b.writeInt32LE(h,22);b.writeUInt16LE(1,26);b.writeUInt16LE(24,28);b.writeUInt32LE(pixels,34);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const d=Math.hypot(x-64,y-64);b.set(d<40?[45,100,210]:[225,235,240],54+y*row+x*3);}
await writeFile('.qa/test-logo.bmp',b);
await writeFile('.qa/broken.png','invalid image data');
console.log('QA fixtures created.');
