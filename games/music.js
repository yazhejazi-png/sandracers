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
  paint();(document.body||document.documentElement).appendChild(b);
})();
