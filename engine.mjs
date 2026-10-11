// Integer orientations: right/up/normal. Grid y increases downwards.
export const directions = [[1,0,'east'],[0,1,'south'],[-1,0,'west'],[0,-1,'north']];
const neg = v => v.map(x => -x);
const key = ([x,y]) => `${x},${y}`;
export function fold({r,u,n}, direction) {
  if (direction === 'east') return {r:neg(n),u:[...u],n:[...r]};
  if (direction === 'west') return {r:[...n],u:[...u],n:neg(r)};
  if (direction === 'north') return {r:[...r],u:neg(n),n:[...u]};
  if (direction === 'south') return {r:[...r],u:[...n],n:neg(u)};
  throw new Error('Unknown fold direction');
}
export function normalLabel(v) {
  const i=v.findIndex(x=>x!==0);
  return i<0 ? '?' : `${v[i]>0?'+':'-'}${'XYZ'[i]}`;
}
export function analyze(input, rootKey=null) {
  if (!Array.isArray(input) || input.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isInteger(n)))) throw new Error('Cells must be integer coordinate pairs');
  const cells=[...new Map(input.map(p=>[key(p),[...p]])).values()].sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
  const base={version:1,cells,valid:false,faces:[],conflicts:[],collisions:[],limitations:'Final unit-cube orientation only; no paper thickness, tabs or collision-free folding animation.'};
  if(cells.length!==6) return {...base,status:'count',message:`Select six squares. You have ${cells.length}.`};
  const selected=new Map(cells.map((p,i)=>[key(p),{cell:p,number:i+1}]));
  if(rootKey!==null&&!selected.has(rootKey)) throw new Error('Root must be a selected cell');
  const root=rootKey??key(cells[0]);
  const orientations=new Map([[root,{r:[1,0,0],u:[0,1,0],n:[0,0,1]}]]);
  const parents=new Map([[root,null]]), queue=[root], conflicts=[];
  for(let i=0;i<queue.length;i++) {
    const from=queue[i], p=selected.get(from).cell;
    for(const [dx,dy,direction] of directions) {
      const to=key([p[0]+dx,p[1]+dy]);
      if(!selected.has(to)) continue;
      const expected=fold(orientations.get(from),direction);
      if(!orientations.has(to)) { orientations.set(to,expected); parents.set(to,{from,direction}); queue.push(to); }
      else if(JSON.stringify(orientations.get(to))!==JSON.stringify(expected)) conflicts.push({from,to,direction,expected,actual:orientations.get(to)});
    }
  }
  const path=id=>{ const result=[]; while(id!==null) {result.unshift(id);id=parents.get(id)?.from??null;} return result; };
  const faces=cells.filter(p=>orientations.has(key(p))).map(p=>({ ...selected.get(key(p)),key:key(p),orientation:orientations.get(key(p)),normal:normalLabel(orientations.get(key(p)).n),path:path(key(p)),parent:parents.get(key(p)) }));
  const groups=new Map(), collisions=[];
  for(const f of faces) {if(groups.has(f.normal)) collisions.push({normal:f.normal,first:groups.get(f.normal).key,second:f.key}); else groups.set(f.normal,f);}
  const result={...base,root,faces,conflicts,collisions};
  if(faces.length!==6) return {...result,status:'disconnected',message:'Connect all six squares edge to edge.'};
  if(conflicts.length) return {...result,status:'cycle',message:'A loop gives one square incompatible fold directions.'};
  if(collisions.length) return {...result,status:'overlap',message:`Two squares land on ${collisions[0].normal}.`};
  return {...result,valid:true,status:'valid',message:'Six faces. No overlap.'};
}
export const presets={cross:[[2,1],[1,2],[2,2],[3,2],[4,2],[2,3]],rectangle:[[1,1],[2,1],[3,1],[1,2],[2,2],[3,2]]};
