import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,fold,normalLabel,presets} from './engine.mjs';

// Independent generator: grow connected square sets, quotient by translations
// and the eight planar dihedral isometries. Does not import engine directions.
const steps=[[1,0],[-1,0],[0,1],[0,-1]];
const cellKey=([x,y])=>`${x},${y}`;
const normalize=cells=>{const minX=Math.min(...cells.map(p=>p[0]));const minY=Math.min(...cells.map(p=>p[1]));return cells.map(([x,y])=>[x-minX,y-minY]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);};
function transform(cells,turns,reflection){return cells.map(([x,y])=>{if(reflection)x=-x;for(let i=0;i<turns;i++)[x,y]=[-y,x];return [x,y];});}
const variants=cells=>[false,true].flatMap(reflect=>[0,1,2,3].map(turn=>normalize(transform(cells,turn,reflect))));
const canonical=cells=>variants(cells).map(v=>JSON.stringify(v)).sort()[0];
function freePolyominoes(size){let shapes=new Map([['[[0,0]]',[[0,0]]]]);for(let n=2;n<=size;n++){const next=new Map();for(const cells of shapes.values()){const occupied=new Set(cells.map(cellKey));for(const [x,y] of cells)for(const [dx,dy] of steps){const p=[x+dx,y+dy];if(occupied.has(cellKey(p)))continue;const grown=[...cells,p],key=canonical(grown);next.set(key,JSON.parse(key));}}shapes=next;}return [...shapes.values()];}
const hexominoes=freePolyominoes(6);
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const zeroClean=v=>v.map(x=>x===0?0:x);
const eqVec=(a,b)=>assert.deepEqual(zeroClean(a),zeroClean(b));
const basisEqual=(a,b)=>{for(const k of ['r','u','n'])eqVec(a[k],b[k]);};
function assertBasis({r,u,n}){for(const v of [r,u,n]){assert.ok(v.every(Number.isInteger));assert.equal(dot(v,v),1);}assert.equal(dot(r,u),0);assert.equal(dot(r,n),0);assert.equal(dot(u,n),0);eqVec(cross(r,u),n);}
const axes=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const bases=axes.flatMap(r=>axes.filter(u=>dot(r,u)===0).map(u=>({r,u,n:cross(r,u)})));
// Independent Rodrigues quarter-turn (cos=0), rather than the engine's swaps.
const rotate=(v,axis,sign)=>zeroClean(cross(axis,v).map((x,i)=>sign*x+axis[i]*dot(axis,v)));
function oracleFold(b,d){const axis=['east','west'].includes(d)?b.u:b.r;const sign={east:1,west:-1,north:-1,south:1}[d];return Object.fromEntries(['r','u','n'].map(k=>[k,rotate(b[k],axis,sign)]));}
const inverse={east:'west',west:'east',north:'south',south:'north'};

test('independent growth enumerates the free polyomino sequence through six cells',()=>{
 const expected=[1,1,2,5,12,35];for(let n=1;n<=6;n++)assert.equal(freePolyominoes(n).length,expected[n-1]);
 assert.equal(new Set(hexominoes.map(canonical)).size,35);
 for(const cells of hexominoes){assert.equal(cells.length,6);assert.equal(new Set(cells.map(cellKey)).size,6);}
});

test('all 24 right-handed bases preserve orthonormality and match independent integer rotations',()=>{
 assert.equal(bases.length,24);
 for(const b of bases)for(const d of Object.keys(inverse)){assertBasis(b);const before=JSON.stringify(b),f=fold(b,d);assertBasis(f);basisEqual(f,oracleFold(b,d));basisEqual(fold(f,inverse[d]),b);let four=b;for(let i=0;i<4;i++)four=fold(four,d);basisEqual(four,b);assert.equal(JSON.stringify(b),before);}
 assert.throws(()=>fold(bases[0],'diagonal'),/Unknown/);
 assert.equal(new Set(axes.map(normalLabel)).size,6);
});

test('the algorithm, without count-based classification, accepts exactly 11 of all 35 free hexominoes',()=>{
 const classifications=hexominoes.map(cells=>analyze(cells));const valid=classifications.filter(x=>x.valid);
 assert.equal(valid.length,11);assert.equal(classifications.filter(x=>!x.valid).length,24);
 for(const x of valid){assert.equal(x.status,'valid');assert.equal(x.faces.length,6);assert.equal(new Set(x.faces.map(f=>f.normal)).size,6);assert.equal(x.collisions.length,0);assert.equal(x.conflicts.length,0);for(const f of x.faces)assertBasis(f.orientation);}
});

test('all 35 shapes retain validity under every D4 transform, every root and translations',()=>{
 let checked=0;
 for(const cells of hexominoes){const expected=analyze(cells).valid;for(const v of variants(cells))for(const [tx,ty] of [[0,0],[-9,13],[101,-117]]){const translated=v.map(([x,y])=>[x+tx,y+ty]);for(const root of translated){const r=analyze(translated,cellKey(root));assert.equal(r.valid,expected,`shape=${canonical(cells)} root=${root}`);assert.equal(r.faces.length,6);for(const f of r.faces)assertBasis(f.orientation);if(expected)assert.equal(new Set(r.faces.map(f=>f.normal)).size,6);checked++;}}}
 assert.equal(checked,35*8*3*6);
});

test('input order has no effect and caller coordinates are not mutated',()=>{
 for(const cells of hexominoes){const before=JSON.stringify(cells),a=analyze(cells),b=analyze([...cells].reverse());assert.deepEqual(a,b);assert.equal(JSON.stringify(cells),before);}
});

test('cycle, overlap and disconnected outcomes distinguish structural defects',()=>{
 const cycle=analyze(presets.rectangle);assert.equal(cycle.valid,false);assert.equal(cycle.status,'cycle');assert.ok(cycle.conflicts.length>0);
 const overlap=analyze([[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]]);assert.equal(overlap.status,'overlap');assert.ok(overlap.collisions.length>0);assert.equal(overlap.conflicts.length,0);
 const disconnected=analyze([[0,0],[1,0],[2,0],[10,0],[11,0],[12,0]]);assert.equal(disconnected.status,'disconnected');assert.equal(disconnected.valid,false);assert.equal(disconnected.faces.length,3);
 assert.equal(analyze(presets.cross).valid,true);
});

test('duplicate coordinates are explicitly normalized, not counted as extra faces',()=>{
 const uniqueFive=[[0,0],[1,0],[2,0],[1,1],[1,-1]];const fakeSix=[...uniqueFive,[0,0]];const r=analyze(fakeSix);assert.equal(r.status,'count');assert.equal(r.cells.length,5);assert.equal(r.valid,false);
 const trueSix=presets.cross;assert.deepEqual(analyze([...trueSix,...trueSix]),analyze(trueSix));
});

test('wrong count, malformed coordinates and unknown roots are rejected',()=>{
 for(const cells of [[],[[0,0]],[[0,0],[1,0],[2,0],[3,0],[4,0]],[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0]]]){const r=analyze(cells);assert.equal(r.status,'count');assert.equal(r.valid,false);assert.equal(r.faces.length,0);}
 for(const bad of [null,{},'six',[[0]],[[0,0,0]],[[0,0],[1.5,1]],[[0,0],[Infinity,1]],[[0,0],[NaN,1]],[[0,0],['1',1]]])assert.throws(()=>analyze(bad),/integer coordinate pairs/);
 assert.throws(()=>analyze(presets.cross,'999,999'),/Root/);
});
