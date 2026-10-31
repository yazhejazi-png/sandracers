/* "+ add time" button on every page: type a lap time, it is saved on this device and shows on the Lap Log. */
(function(){
  var KEY="sr-times", EN=document.documentElement.lang==="en";
  var L=function(a,e){return EN?e:a;};
  function load(){try{var v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)?v:[];}catch(e){return [];}}
  function save(v){try{localStorage.setItem(KEY,JSON.stringify(v));return true;}catch(e){return false;}}
  function parse(s){
    s=String(s).trim().replace(/[٠-٩]/g,function(d){return "٠١٢٣٤٥٦٧٨٩".indexOf(d);}).replace(/[:٫،,]/g,function(c){return c===":"?":":".";});
    var m=s.match(/^(?:(\d+):)?(\d{1,3})(?:\.(\d{1,3}))?$/); if(!m)return null;
    var ms=(+(m[1]||0))*60000+(+m[2])*1000+(m[3]?Math.round(+("0."+m[3])*1000):0);
    return ms>0?ms:null;
  }
  function fmt(ms){var m=Math.floor(ms/60000),r=ms-m*60000,s=Math.floor(r/1000);return m+":"+String(s).padStart(2,"0")+"."+String(r-s*1000).padStart(3,"0");}
  var css=document.createElement("style");
  css.textContent=".at-btn{position:fixed;inset-inline-start:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:18;height:60px;border-radius:999px;border:0;padding:0 20px;background:var(--accent,#B4621F);color:var(--on-accent,#FFFAF2);font:800 1rem/1 var(--display,sans-serif);display:flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 10px 26px var(--shadow,rgba(0,0,0,.3))}.at-btn b{font-size:1.6rem;line-height:1}"+
  ".at-ov{position:fixed;inset:0;z-index:20;background:rgba(12,9,6,.5);display:grid;place-items:center;padding:16px}.at-ov[hidden]{display:none}"+
  ".at-card{background:var(--panel,#FFFAF2);color:var(--fg,#291C13);border:3px solid var(--frame,#291C13);border-radius:16px;padding:18px;width:min(100%,380px);max-height:90vh;overflow:auto;display:grid;gap:10px}"+
  ".at-card h2{margin:0;font-size:1.4rem}.at-card label{display:grid;gap:4px;font-size:.85rem;color:var(--muted,#6E5644)}"+
  ".at-card input{font:inherit;font-size:1.1rem;padding:10px;border-radius:10px;border:2px solid var(--line,#E6D0AE);background:var(--bg,#FBF3E6);color:var(--fg,#291C13);width:100%;box-sizing:border-box}"+
  ".at-row{display:flex;gap:8px}.at-row button{flex:1;font:800 1rem var(--display,sans-serif);padding:12px;border-radius:10px;border:2px solid var(--frame,#291C13);cursor:pointer;background:var(--raise,#F5E6CF);color:var(--fg,#291C13)}.at-row .go{background:var(--accent,#B4621F);color:var(--on-accent,#FFFAF2)}"+
  ".at-err{color:#C4541A;font-size:.9rem;min-height:1.2em;margin:0}.at-list{display:grid;gap:4px;font-size:.9rem}.at-list div{display:flex;justify-content:space-between;gap:8px;align-items:center;border-top:1px solid var(--line,#E6D0AE);padding-top:4px}.at-list button{border:0;background:none;color:var(--muted,#6E5644);font-size:1.1rem;cursor:pointer}"+
  "html.sk-on body{padding-bottom:calc(84px + env(safe-area-inset-bottom,0px))}@media print{.at-btn,.at-ov{display:none}}";
  document.head.appendChild(css);
  var today=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  var btn=document.createElement("button");btn.type="button";btn.className="at-btn";btn.innerHTML="<b>+</b>"+L("وقت","Time");btn.setAttribute("aria-label",L("أضف وقت لفّة","Add a lap time"));
  var ov=document.createElement("div");ov.className="at-ov";ov.hidden=true;
  ov.innerHTML='<form class="at-card" role="dialog" aria-modal="true"><h2>'+L("أضف وقت لفّة","Add a lap time")+'</h2>'+
   '<label>'+L("الوقت (مثال 2:39.512)","Time (e.g. 2:39.512)")+'<input name="t" inputmode="decimal" autocomplete="off" dir="ltr" placeholder="2:39.512"></label>'+
   '<label>'+L("التاريخ","Date")+'<input name="d" type="date" value="'+today+'"></label>'+
   '<label>'+L("الحلبة","Track")+'<input name="k" value="Jeddah Corniche Circuit" dir="ltr"></label>'+
   '<p class="at-err" role="alert"></p><div class="at-row"><button type="button" class="x">'+L("إغلاق","Close")+'</button><button class="go">'+L("حفظ","Save")+'</button></div><div class="at-list"></div></form>';
  document.body.append(btn,ov);
  var f=ov.querySelector("form"),err=ov.querySelector(".at-err"),list=ov.querySelector(".at-list");
  function render(){
    var v=load(),rows=[];v.forEach(function(s,i){(s.laps||[]).forEach(function(ms,j){rows.push([i,j,s.date,ms]);});});
    list.innerHTML="";rows.slice().reverse().slice(0,6).forEach(function(r){
      var d=document.createElement("div"),sp=document.createElement("span"),x=document.createElement("button");
      sp.textContent=r[2]+"  "+fmt(r[3]);sp.style.direction="ltr";x.type="button";x.textContent="✕";x.setAttribute("aria-label",L("احذف","Delete"));
      x.onclick=function(){var a=load();a[r[0]].laps.splice(r[1],1);a=a.filter(function(s){return s.laps.length;});save(a);render();if(window.srTimesChanged)location.reload();};
      d.append(sp,x);list.append(d);});
  }
  btn.onclick=function(){ov.hidden=false;err.textContent="";render();f.t.focus();};
  ov.querySelector(".x").onclick=function(){ov.hidden=true;};
  ov.addEventListener("click",function(e){if(e.target===ov)ov.hidden=true;});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")ov.hidden=true;});
  f.onsubmit=function(e){
    e.preventDefault();var ms=parse(f.t.value);
    if(!ms){err.textContent=L("اكتب الوقت مثل 2:39.512","Type the time like 2:39.512");return;}
    var d=f.d.value||today,k=(f.k.value||"").trim()||"Jeddah Corniche Circuit",v=load(),s=v.filter(function(x){return x.date===d&&x.track===k;})[0];
    if(!s){s={date:d,track:k,laps:[],local:true};v.push(s);}s.laps.push(ms);
    if(!save(v)){err.textContent=L("ما قدرت أحفظ على هالجهاز","Could not save on this device");return;}
    f.t.value="";render();
    if(window.srTimesChanged){location.reload();}else{err.style.color="var(--good,#2E7D32)";err.textContent=L("انحفظ: ","Saved: ")+fmt(ms)+" ✓";setTimeout(function(){err.style.color="";},50);}
  };
})();
