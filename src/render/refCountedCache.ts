/** Share an immutable resource while at least one owner uses it. */
export class RefCountedCache<T>{
 private readonly entries=new Map<string,{value:T;references:number}>();
 constructor(private readonly dispose:(value:T)=>void){}
 acquire(key:string,create:()=>T){
  let entry=this.entries.get(key);
  if(!entry){entry={value:create(),references:0};this.entries.set(key,entry);}
  entry.references++;
  let released=false;
  return {value:entry.value,release:()=>{if(released)return;released=true;if(--entry!.references===0){this.entries.delete(key);this.dispose(entry!.value);}}};
 }
}
