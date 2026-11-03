/* Sand Racers: background music for the games. One <script src="../music.js" data-track="mood-oud-132"> per game.
   Plays our own originals (games/audio/), starts on the first tap or key, loops, has a small mute button (remembered). */
(function(){
  var s=document.currentScript,t=s&&s.getAttribute('data-track');if(!t)return;
  var base=s.src.replace(/music\.js[^/]*$/,'')+'audio/';
  function mk(n){var x=new Audio(base+n+'.mp3');x.loop=true;x.volume=.35;x.preload='none';return x;}
  var a=mk(t),cur=t;
  var off=false;try{off=localStorage.getItem('sr-music')==='off';}catch(e){}
  var b=document.createElement('button');b.type='button';
  b.style.cssText='position:fixed;left:10px;bottom:10px;z-index:9999;width:36px;height:36px;border-radius:50%;border:2px solid #291C13;background:#FFFAF2;color:#291C13;font:700 18px/1 system-ui;opacity:.8;cursor:pointer;padding:0';
  function paint(){b.textContent=off?'♪̸':'♪';b.setAttribute('aria-label',off?'Music off':'Music on');b.setAttribute('aria-pressed',String(!off));}
  var started=false;
  function go(){started=true;if(!off&&a.paused){var p=a.play();if(p&&p.catch)p.catch(function(){});}}
  b.addEventListener('click',function(e){e.stopPropagation();off=!off;try{localStorage.setItem('sr-music',off?'off':'on');}catch(x){}
    if(off)a.pause();else go();paint();});
  ['pointerdown','keydown','touchstart'].forEach(function(ev){addEventListener(ev,go,{passive:true});});
  document.addEventListener('visibilitychange',function(){if(document.hidden)a.pause();else go();});
  /* optional: a game can switch the track (e.g. window.srMusic.set('mood-final-lap-160')) */
  window.srMusic={set:function(n){if(!n||n===cur)return;var was=!a.paused;a.pause();cur=n;a=mk(n);if(was||started)go();}};
  /* the stage pages keep pill buttons in this same corner (full screen, and on the SUV pages the car button): if the note would sit on one, it goes just above them; every other page is unchanged */
  function place(){try{b.style.bottom='10px';var H=document.documentElement.clientHeight;
    for(var k=0;k<4;k++){var r=b.getBoundingClientRect(),hit=null,els=document.querySelectorAll('#game button,#fs');
      for(var i=0;i<els.length;i++){var q=els[i].getBoundingClientRect();
        if(q.height>0&&q.width>q.height*1.3){var ix=Math.min(r.right,q.right)-Math.max(r.left,q.left),iy=Math.min(r.bottom,q.bottom)-Math.max(r.top,q.top);
          if(ix>0&&iy>0&&ix*iy>=.15*r.width*r.height&&(!hit||q.top<hit.top))hit=q;}}
      if(!hit)return;b.style.bottom=(H-hit.top+8)+'px';}}catch(e){}}
  paint();(document.body||document.documentElement).appendChild(b);
  place();addEventListener('resize',place);addEventListener('load',place);
})();
