/** Solar position for Taoyuan, Taiwan (25.08 N, 121.14 E, UTC+8). */
export function lightingState(hour:number,weather:string,date='2026-09-06'){
 const rad=Math.PI/180,lat=25.08*rad,bearing=49.08*rad,match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(date),year=match?Number(match[1]):2026,month=match?Number(match[2]):9,day=match?Number(match[3]):6;
 const dayOfYear=Math.floor((Date.UTC(year,month-1,day)-Date.UTC(year,0,1))/86400000)+1,yearLength=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000,gamma=2*Math.PI/yearLength*(dayOfYear-1+(hour-12)/24);
 const declination=.006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
 const equationOfTime=229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma)),solarMinutes=hour*60+equationOfTime+4*121.14-60*8,hourAngle=(solarMinutes/4-180)*rad;
 const east=-Math.cos(declination)*Math.sin(hourAngle),north=Math.cos(lat)*Math.sin(declination)-Math.sin(lat)*Math.cos(declination)*Math.cos(hourAngle),up=Math.sin(lat)*Math.sin(declination)+Math.cos(lat)*Math.cos(declination)*Math.cos(hourAngle);
 const x=east*Math.sin(bearing)+north*Math.cos(bearing),z=east*Math.cos(bearing)-north*Math.sin(bearing);
 const smooth=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
 const daylight=smooth(-.10,.10,up),sunHeight=smooth(-.025,.20,up),artificial=1-smooth(-.09,.08,up),warm=(1-smooth(.06,.38,up))*sunHeight;
 const cloudiness=weather==='clear'?.18:weather==='cloudy'?.56:weather==='rain'?.82:.95;
 return {x,z,up,daylight,sunHeight,artificial,warm,cloudiness,shadowStrength:sunHeight*(1-cloudiness*.78)};
}
