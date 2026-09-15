import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const XOR_KEY=171;
const PASSWORD=process.env.SOON_SPI2_KEY||'spine_encrypt_2025';

function xorFirst(buf,n=64){
 const out=Buffer.from(buf);
 const lim=Math.min(out.length,n);
 for(let i=0;i<lim;i++)out[i]^=XOR_KEY;
 return out;
}

function md5(buf){
 return createHash('md5').update(buf).digest();
}

function keystream(password,iv,length){
 const seed=md5(Buffer.concat([Buffer.from(password,'utf8'),iv]));
 const out=Buffer.alloc(length);
 for(let i=0;i<length;i++)out[i]=seed[i%16]^(i&255);
 return out;
}

function xorCycle(data,key){
 const out=Buffer.alloc(data.length);
 for(let i=0;i<data.length;i++)out[i]=data[i]^key[i%key.length];
 return out;
}

function decodeSpi2(raw,password){
 let file=raw;
 const magic=file.subarray(0,4).toString('ascii');
 if(magic!=='SPI2'&&magic!=='SPIN')file=xorFirst(raw);
 if(file.subarray(0,4).toString('ascii')!=='SPI2'&&file.subarray(0,4).toString('ascii')!=='SPIN'){
  throw new Error('magic '+raw.subarray(0,4).toString('hex')+' / '+file.subarray(0,4).toString('hex'));
 }
 const view=new DataView(file.buffer,file.byteOffset,file.byteLength);
 let a=8;
 const count=view.getUint32(a,true);a+=4;
 let jsonLen=0,atlasLen=0,pngLen=0;
 if(count===3){
  jsonLen=view.getUint32(a,true);a+=4;
  atlasLen=view.getUint32(a,true);a+=4;
  pngLen=view.getUint32(a,true);a+=4;
 }else if(count===2){
  atlasLen=view.getUint32(a,true);a+=4;
  pngLen=view.getUint32(a,true);a+=4;
 }else throw new Error('file count '+count);
 const jsonData=jsonLen?file.subarray(a,a+jsonLen):Buffer.alloc(0);
 a+=jsonLen;
 const atlasIv=file.subarray(a,a+16);a+=16;
 const atlasEnc=file.subarray(a,a+(atlasLen-16));a+=atlasLen-16;
 const pngIv=file.subarray(a,a+16);a+=16;
 const pngEnc=file.subarray(a,a+(pngLen-16));
 return {
  json:jsonData,
  atlas:xorCycle(atlasEnc,keystream(password,atlasIv,65536)),
  png:xorCycle(pngEnc,keystream(password,pngIv,65536)),
 };
}

const [,,inPath,outDir]=process.argv;
if(!inPath||!outDir){
 console.error('usage: node decode-spi2.mjs <in.bin2> <outDir>');
 process.exit(1);
}
const raw=readFileSync(resolve(inPath));
const out=decodeSpi2(raw,PASSWORD);
const atlas=out.atlas.toString('utf8');
const pngName=(atlas.match(/^([^\r\n]+)/)||['decoded.png'])[0].trim();
const dest=resolve(outDir);
mkdirSync(dest,{recursive:true});
writeFileSync(resolve(dest,'decoded.atlas'),out.atlas);
writeFileSync(resolve(dest,pngName.endsWith('.png')?pngName:'decoded.png'),out.png);
if(out.json.length)writeFileSync(resolve(dest,'decoded.json'),out.json);
console.log({magic:'ok',jsonBytes:out.json.length,atlasBytes:out.atlas.length,pngBytes:out.png.length,outDir:dest});
