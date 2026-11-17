/* Generador de códigos QR mínimo (modo byte, versiones 1–6, corrección L/M).
   Uso: QR.svg("https://...", {ecl:"M", color:"#000"}) → string <svg>.
   Basado en el estándar ISO/IEC 18004; sin dependencias. */
(function(root){
"use strict";
// [ec por bloque, bloques, datos por bloque] para versiones 1..6
const TABLE = {
  L: [null,[7,1,19],[10,1,34],[15,1,55],[20,1,80],[26,1,108],[18,2,68]],
  M: [null,[10,1,16],[16,1,28],[26,1,44],[18,2,32],[24,2,43],[16,4,27]]
};
const ALIGN = [null,[],[6,18],[6,22],[6,26],[6,30],[6,34]];
const FMT = {L:1, M:0};

function gmul(x, y){ let z = 0; for(let i=7;i>=0;i--){ z = (z<<1) ^ ((z>>>7)*0x11D); z ^= ((y>>>i)&1)*x; } return z & 0xFF; }
function rsDivisor(deg){
  const r = new Array(deg).fill(0); r[deg-1] = 1; let root = 1;
  for(let i=0;i<deg;i++){
    for(let j=0;j<r.length;j++){ r[j] = gmul(r[j], root); if(j+1<r.length) r[j] ^= r[j+1]; }
    root = gmul(root, 2);
  }
  return r;
}
function rsRemainder(data, div){
  const r = new Array(div.length).fill(0);
  for(const b of data){ const f = b ^ r.shift(); r.push(0); div.forEach((c,i) => r[i] ^= gmul(c,f)); }
  return r;
}
function utf8(s){ return Array.from(new TextEncoder().encode(s)); }

function encode(text, ecl){
  ecl = ecl || "M";
  const bytes = utf8(text);
  let ver = 0;
  for(let v=1; v<=6; v++){ const [,n,d] = TABLE[ecl][v]; if(4 + 8 + bytes.length*8 <= n*d*8){ ver = v; break; } }
  if(!ver) throw new Error("Texto demasiado largo para el QR");
  const [ecLen, nBlocks, dLen] = TABLE[ecl][ver];
  const cap = nBlocks * dLen;
  // bits
  const bits = [];
  const put = (val, len) => { for(let i=len-1;i>=0;i--) bits.push((val>>>i)&1); };
  put(4,4); put(bytes.length,8); bytes.forEach(b => put(b,8));
  put(0, Math.min(4, cap*8 - bits.length));
  while(bits.length % 8) bits.push(0);
  const data = [];
  for(let i=0;i<bits.length;i+=8) data.push(parseInt(bits.slice(i,i+8).join(""),2));
  for(let p=0; data.length < cap; p++) data.push(p%2 ? 0x11 : 0xEC);
  // bloques + corrección
  const div = rsDivisor(ecLen), blocks = [];
  for(let b=0;b<nBlocks;b++){ const d = data.slice(b*dLen,(b+1)*dLen); blocks.push({d, e:rsRemainder(d,div)}); }
  const cw = [];
  for(let i=0;i<dLen;i++) blocks.forEach(b => cw.push(b.d[i]));
  for(let i=0;i<ecLen;i++) blocks.forEach(b => cw.push(b.e[i]));

  const size = ver*4 + 17;
  const M = Array.from({length:size}, () => new Array(size).fill(false));
  const F = Array.from({length:size}, () => new Array(size).fill(false));
  const set = (x,y,v) => { M[y][x] = v; F[y][x] = true; };
  // patrones de temporización
  for(let i=0;i<size;i++){ set(6,i,i%2===0); set(i,6,i%2===0); }
  // localizadores
  const finder = (cx,cy) => {
    for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){
      const x=cx+dx, y=cy+dy; if(x<0||y<0||x>=size||y>=size) continue;
      const d = Math.max(Math.abs(dx),Math.abs(dy)); set(x,y, d!==2 && d!==4);
    }
  };
  finder(3,3); finder(size-4,3); finder(3,size-4);
  // alineación
  const al = ALIGN[ver];
  for(const ay of al) for(const ax of al){
    if((ax===6&&ay===6)||(ax===6&&ay===size-7)||(ax===size-7&&ay===6)) continue;
    for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) set(ax+dx, ay+dy, Math.max(Math.abs(dx),Math.abs(dy)) !== 1);
  }
  // reservar formato
  const drawFormat = (mask) => {
    const d = (FMT[ecl]<<3) | mask; let r = d;
    for(let i=0;i<10;i++) r = (r<<1) ^ ((r>>>9)*0x537);
    const b = ((d<<10) | r) ^ 0x5412, g = i => ((b>>>i)&1) === 1;
    for(let i=0;i<=5;i++) set(8,i,g(i));
    set(8,7,g(6)); set(8,8,g(7)); set(7,8,g(8));
    for(let i=9;i<15;i++) set(14-i,8,g(i));
    for(let i=0;i<8;i++) set(size-1-i,8,g(i));
    for(let i=8;i<15;i++) set(8,size-15+i,g(i));
    set(8,size-8,true);
  };
  drawFormat(0);
  // datos
  let i = 0;
  for(let right=size-1; right>=1; right-=2){
    if(right===6) right = 5;
    for(let vert=0; vert<size; vert++) for(let j=0;j<2;j++){
      const x = right-j, up = ((right+1)&2) === 0, y = up ? size-1-vert : vert;
      if(!F[y][x] && i < cw.length*8){ M[y][x] = ((cw[i>>>3] >>> (7-(i&7))) & 1) === 1; i++; }
    }
  }
  const maskFn = [
    (x,y)=>(x+y)%2===0, (x,y)=>y%2===0, (x,y)=>x%3===0, (x,y)=>(x+y)%3===0,
    (x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0, (x,y)=>x*y%2+x*y%3===0,
    (x,y)=>(x*y%2+x*y%3)%2===0, (x,y)=>((x+y)%2+x*y%3)%2===0
  ];
  const applyMask = m => { for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(!F[y][x] && maskFn[m](x,y)) M[y][x] = !M[y][x]; };
  const penalty = () => {
    let p = 0;
    for(let a=0;a<2;a++) for(let k=0;k<size;k++){
      let run = 1;
      for(let l=1;l<size;l++){
        const c = a ? M[l][k] : M[k][l], pc = a ? M[l-1][k] : M[k][l-1];
        if(c===pc){ run++; if(run===5) p+=3; else if(run>5) p++; } else run = 1;
      }
    }
    for(let y=0;y<size-1;y++) for(let x=0;x<size-1;x++){ const c=M[y][x]; if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1]) p+=3; }
    let dark = 0; M.forEach(r => r.forEach(c => dark += c));
    p += Math.floor(Math.abs(dark*20 - size*size*10) / (size*size)) * 10;
    return p;
  };
  let best = 0, bestP = Infinity;
  for(let m=0;m<8;m++){ applyMask(m); drawFormat(m); const p = penalty(); if(p<bestP){ bestP=p; best=m; } applyMask(m); }
  applyMask(best); drawFormat(best);
  return M;
}

function svg(text, opt){
  opt = opt || {};
  const M = encode(text, opt.ecl), n = M.length, q = 4, s = n + q*2;
  let d = "";
  M.forEach((row,y) => row.forEach((c,x) => { if(c) d += `M${x+q} ${y+q}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges"><rect width="${s}" height="${s}" fill="${opt.bg||"#fff"}"/><path d="${d}" fill="${opt.color||"#000"}"/></svg>`;
}
root.QR = {encode, svg};
if(typeof module !== "undefined") module.exports = root.QR;
})(typeof window !== "undefined" ? window : globalThis);
