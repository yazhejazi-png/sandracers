/* Sand Racers: shared real car sounds for the games (M2 engine, Supra engine, air brake, tyre squeal, exhaust pops).
   One script, loaded next to music.js. A game calls CarAudio.init(audioContext, outNode) once, CarAudio.tick({...}) every frame and CarAudio.pop(big) on an exhaust pop.
   Files: games/audio/sfx/*.mp3 (96k-or-less mono, levelled to the same loudness). Car 'sawda' (السودا) uses the Supra engine, every other car the M2. */
(function(){
  var s=document.currentScript,base=s&&s.src?s.src.replace(/car-audio\.js[^/]*$/,'')+'audio/sfx/':'audio/sfx/';
  var AC,out,B={},L={},clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};
  function loop(k,t){var b=B[k];if(!b)return null;if(L[k])return L[k];
    var src=AC.createBufferSource(),g=AC.createGain();g.gain.value=0;src.buffer=b;src.loop=true;src.connect(g);g.connect(out);src.start(t||AC.currentTime,Math.random()*b.duration*0.8);
    return(L[k]={s:src,g:g});}
  window.CarAudio={
    init:function(ac,o){if(AC)return;AC=ac;out=o;
      ['m2loop','supraloop','squeal','brake','exh'].forEach(function(k){
        try{fetch(base+k+'.mp3').then(function(r){return r.arrayBuffer();}).then(function(a){return AC.decodeAudioData(a);}).then(function(b){B[k]=b;}).catch(function(){});}catch(e){}});},
    /* st: {car, rr (0-1 rpm share), load (0-1 gas), live, fade (0-1), brake (0-1), speed, slide} */
    tick:function(st){if(!AC)return;var t=AC.currentTime,sup=st.car==='sawda';
      var ke=sup?'supraloop':'m2loop',ko=sup?'m2loop':'supraloop';
      var e=loop(ke),o=L[ko];
      if(e){e.s.playbackRate.setTargetAtTime(0.55+1.15*st.rr,t,0.05);
        e.g.gain.setTargetAtTime(st.live?(0.2+0.32*st.load)*(0.5+0.5*st.rr)*st.fade:0,t,0.05);}
      if(o)o.g.gain.setTargetAtTime(0,t,0.05);
      var br=loop('brake');
      if(br)br.g.gain.setTargetAtTime(st.live&&st.brake>0&&st.speed>6?0.45*Math.min(1,st.speed/20):0,t,0.06);
      var sq=loop('squeal');
      if(sq){var sk=st.live?clamp(((st.slide||0)-3.2)/5.5,0,1)*clamp(st.speed/9,0,1):0;
        sq.g.gain.setTargetAtTime(0.09*sk*sk,t,0.06);sq.s.playbackRate.setTargetAtTime(0.62+0.18*sk,t,0.08);}},
    pop:function(big){if(!AC||!big||!B.exh)return;var s2=AC.createBufferSource(),g=AC.createGain();s2.buffer=B.exh;g.gain.value=0.38;s2.connect(g);g.connect(out);s2.start();}
  };
})();

/* Grid games (traffic pages): CarAudio.grid() makes its own AudioContext on the first tap and gives event hooks:
   start(), drive(moving, speed01), orb(), bump(), lose(), win(), honk(). Same sample files, same loudness. */
(function(){
  var s=document.currentScript,base=s&&s.src?s.src.replace(/car-audio\.js[^/]*$/,'')+'audio/sfx/':'audio/sfx/';
  window.CarAudio.grid=function(){
    var AC,out,B={},loopSrc=null,loopG=null,on=true,ready=false,t0=0;
    try{on=localStorage.getItem('sr-music')!=='off';}catch(e){}
    function boot(){if(AC){if(AC.state==='suspended')AC.resume();return;}
      var C=window.AudioContext||window.webkitAudioContext;if(!C)return;try{AC=new C();}catch(e){AC=null;return;}
      out=AC.createGain();out.gain.value=1.1;out.connect(AC.destination);
      ['m2loop','exh','brake','start','stall','oud'].forEach(function(k){try{fetch(base+k+'.mp3').then(function(r){return r.arrayBuffer();}).then(function(a){return AC.decodeAudioData(a);}).then(function(b){B[k]=b;}).catch(function(){});}catch(e){}});}
    ['pointerdown','keydown','touchstart'].forEach(function(ev){addEventListener(ev,boot,{passive:true});});
    function one(k,v,rate){if(!AC||!on||!B[k])return;var x=AC.createBufferSource(),g=AC.createGain();x.buffer=B[k];if(rate)x.playbackRate.value=rate;g.gain.value=v;x.connect(g);g.connect(out);x.start();}
    function hush(){if(loopG)loopG.gain.setTargetAtTime(0,AC.currentTime,0.08);}
    return{
      start:function(){boot();one('start',0.7);},
      drive:function(moving,sp){if(!AC||!B.m2loop)return;
        if(!loopSrc){loopSrc=AC.createBufferSource();loopG=AC.createGain();loopG.gain.value=0;loopSrc.buffer=B.m2loop;loopSrc.loop=true;loopSrc.connect(loopG);loopG.connect(out);loopSrc.start();}
        var t=AC.currentTime;loopSrc.playbackRate.setTargetAtTime(0.6+0.7*sp,t,0.1);loopG.gain.setTargetAtTime(on&&moving?0.12+0.2*sp:0,t,0.1);},
      orb:function(){one('exh',0.3);},
      bump:function(){one('brake',0.45,1.2);},
      lose:function(){hush();one('stall',0.6);},
      win:function(){hush();one('oud',0.6);},
      stop:hush
    };};
})();
