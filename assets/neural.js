/* 3bra.in neural field — anchored somas (home) + depth-of-field field (content pages).
   Subtle activity: faint axon lines connect the somas; occasional pulses (~1 / 3s) ride
   those exact lines, and a few travel off toward distant fading fibers.
   Home somas: dendrites behind the box, cell-body on a top layer straddling the rim.
   Map capped to site max-width. Respects prefers-reduced-motion. */
(function(){
  function mb(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  function build(canvas){
    var seed=+canvas.dataset.seed||7,
        density=parseFloat(canvas.dataset.density||"1"),
        dim=parseFloat(canvas.dataset.dim||"1"),
        focusN=canvas.dataset.focus!=null?+canvas.dataset.focus:2,
        dof=canvas.dataset.dof!=null?+canvas.dataset.dof:1;
    var main=canvas.getContext('2d'), R, topC=null, topX=null;
    var NODES=[], anim={raf:0,timer:0,pulses:[],tracks:[],buf:null,W:0,H:0,dpr:1};
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function paintNeurons(ctx,W,H,alpha,scMin,scMax,count,glow,somaList){
      function bouton(px,py){
        var amber=R()<0.11;
        if(!amber&&R()<0.5) return;
        ctx.shadowBlur=amber?16:(glow?7:0);
        ctx.shadowColor=amber?'rgba(233,169,86,'+(0.9*dim)+')':'rgba(160,205,255,0.7)';
        ctx.fillStyle=amber?'rgba(255,200,120,'+(0.95*alpha*dim)+')':'rgba(205,228,255,'+(0.8*alpha*dim)+')';
        ctx.beginPath(); ctx.arc(px,py,amber?1.5+R()*1.3:0.7+R()*0.8,0,7); ctx.fill();
      }
      function branch(px,py,ang,len,w,depth){
        if(depth<=0||w<0.35){ bouton(px,py); return; }
        var steps=Math.max(6,len/9), sl=len/steps;
        for(var i=0;i<steps;i++){
          ang+=(R()-0.5)*0.34;
          var nx=px+Math.cos(ang)*sl, ny=py+Math.sin(ang)*sl, ww=w*(1-i/steps*0.5);
          ctx.strokeStyle='rgba(150,200,242,'+((0.12+0.26*(w/3.2))*alpha*dim)+')';
          ctx.lineWidth=Math.max(0.4,ww);
          if(glow){ctx.shadowBlur=5;ctx.shadowColor='rgba(120,180,235,0.5)';}else{ctx.shadowBlur=0;}
          ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(nx,ny); ctx.stroke();
          if(depth>1&&R()<0.11){ branch(nx,ny,ang+(R()<0.5?1:-1)*(0.5+R()*0.6),len*(0.5+R()*0.22),ww*0.62,depth-1); }
          px=nx; py=ny;
        }
        if(depth>1){ var n=2+(R()<0.4?1:0);
          for(var k=0;k<n;k++) branch(px,py,ang+(R()-0.5)*1.5,len*(0.6+R()*0.25),w*0.6,depth-1); }
        else bouton(px,py);
      }
      function soma(sx,sy,sc){
        var g=ctx.createRadialGradient(sx,sy,0,sx,sy,30*sc);
        g.addColorStop(0,'rgba(180,215,255,'+(0.5*alpha*dim)+')');
        g.addColorStop(0.4,'rgba(120,175,235,'+(0.16*alpha*dim)+')');
        g.addColorStop(1,'transparent');
        ctx.shadowBlur=0; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(sx,sy,30*sc,0,7); ctx.fill();
        ctx.fillStyle='rgba(210,230,255,'+(0.5*alpha*dim)+')'; ctx.beginPath(); ctx.arc(sx,sy,4.2*sc,0,7); ctx.fill();
        var prim=3+Math.floor(R()*3);
        for(var k=0;k<prim;k++){ var an=R()*6.283;
          branch(sx+Math.cos(an)*6*sc,sy+Math.sin(an)*6*sc,an,(120+R()*95)*sc,3.0*sc,5); }
      }
      ctx.lineCap='round'; ctx.lineJoin='round';
      if(somaList){ for(var s=0;s<somaList.length;s++){ var L=somaList[s]; soma(W*L[0],H*L[1],L[2]); } }
      else { for(var i=0;i<count;i++) soma(W*R(),H*R(),scMin+R()*(scMax-scMin)); }
      ctx.shadowBlur=0; return soma;
    }
    function offscreen(W,H,dpr){
      var oc=document.createElement('canvas'); oc.width=W*dpr; oc.height=H*dpr;
      var ox=oc.getContext('2d'); ox.setTransform(dpr,0,0,dpr,0,0);
      return {oc:oc,ox:ox};
    }
    function ensureTop(W,H,dpr){
      if(!topC){
        topC=document.createElement('canvas'); topC.setAttribute('aria-hidden','true');
        topC.style.cssText='position:fixed;inset:0;width:100%;height:100%;max-width:var(--maxw);margin-inline:auto;z-index:4;pointer-events:none;display:block;';
        document.body.appendChild(topC); topX=topC.getContext('2d');
      }
      topC.width=W*dpr; topC.height=H*dpr; topX.setTransform(dpr,0,0,dpr,0,0); topX.clearRect(0,0,W,H);
      return topX;
    }
    function rimPoint(a,hw,hh,rr){
      var dx=Math.cos(a), dy=Math.sin(a);
      var tx=Math.abs(dx)<1e-6?1e9:hw/Math.abs(dx);
      var ty=Math.abs(dy)<1e-6?1e9:hh/Math.abs(dy);
      var t=Math.min(tx,ty), rx=dx*t, ry=dy*t, cx=hw-rr, cy=hh-rr;
      if(Math.abs(rx)>cx&&Math.abs(ry)>cy){
        var ccx=(rx<0?-1:1)*cx, ccy=(ry<0?-1:1)*cy, vx=rx-ccx, vy=ry-ccy, vl=Math.hypot(vx,vy)||1;
        rx=ccx+vx/vl*rr; ry=ccy+vy/vl*rr;
      }
      return {x:rx,y:ry};
    }
    function aBouton(px,py){
      var amber=R()<0.11;
      if(!amber&&R()<0.5) return;
      main.shadowBlur=amber?16:7;
      main.shadowColor=amber?'rgba(233,169,86,'+(0.9*dim)+')':'rgba(160,205,255,0.7)';
      main.fillStyle=amber?'rgba(255,200,120,'+(0.95*dim)+')':'rgba(205,228,255,'+(0.8*dim)+')';
      main.beginPath(); main.arc(px,py,amber?1.5+R()*1.3:0.7+R()*0.8,0,7); main.fill();
    }
    function aBranch(px,py,ang,len,w,depth){
      if(depth<=0||w<0.35){ aBouton(px,py); return; }
      var steps=Math.max(6,len/9), sl=len/steps;
      for(var i=0;i<steps;i++){
        ang+=(R()-0.5)*0.34;
        var nx=px+Math.cos(ang)*sl, ny=py+Math.sin(ang)*sl, ww=w*(1-i/steps*0.5);
        main.strokeStyle='rgba(150,200,242,'+((0.12+0.26*(w/3.2))*dim)+')';
        main.lineWidth=Math.max(0.4,ww);
        main.shadowBlur=5; main.shadowColor='rgba(120,180,235,0.5)';
        main.beginPath(); main.moveTo(px,py); main.lineTo(nx,ny); main.stroke();
        if(depth>1&&R()<0.11){ aBranch(nx,ny,ang+(R()<0.5?1:-1)*(0.5+R()*0.6),len*(0.5+R()*0.22),ww*0.62,depth-1); }
        px=nx; py=ny;
      }
      if(depth>1){ var n=2+(R()<0.4?1:0);
        for(var k=0;k<n;k++) aBranch(px,py,ang+(R()-0.5)*1.5,len*(0.6+R()*0.25),w*0.6,depth-1); }
      else aBouton(px,py);
    }
    function somaMain(sx,sy,sc,outAng,spread){
      var g=main.createRadialGradient(sx,sy,0,sx,sy,30*sc);
      g.addColorStop(0,'rgba(150,190,235,'+(0.26*dim)+')');
      g.addColorStop(0.5,'rgba(110,165,225,'+(0.09*dim)+')');
      g.addColorStop(1,'transparent');
      main.shadowBlur=0; main.fillStyle=g; main.beginPath(); main.arc(sx,sy,30*sc,0,7); main.fill();
      var prim=3+Math.floor(R()*3);
      for(var k=0;k<prim;k++){
        var an=(outAng==null)?R()*6.283:(outAng+(R()-0.5)*spread);
        aBranch(sx+Math.cos(an)*6*sc, sy+Math.sin(an)*6*sc, an, (120+R()*95)*sc, 3.0*sc, 5);
      }
    }
    function somaBody(sx,sy,sc){
      topX.shadowBlur=10*sc; topX.shadowColor='rgba(150,200,250,0.8)';
      var g=topX.createRadialGradient(sx,sy,0,sx,sy,11*sc);
      g.addColorStop(0,'rgba(226,240,255,0.92)');
      g.addColorStop(0.5,'rgba(150,192,236,0.4)');
      g.addColorStop(1,'transparent');
      topX.fillStyle=g; topX.beginPath(); topX.arc(sx,sy,11*sc,0,7); topX.fill();
      topX.shadowBlur=0; topX.fillStyle='rgba(238,247,255,0.96)';
      topX.beginPath(); topX.arc(sx,sy,2.6*sc,0,7); topX.fill();
    }
    function anchoredSomas(W,H,cr){
      NODES=[]; main.lineCap='round'; main.lineJoin='round';
      var cx=W*0.44, cy=H*0.52;
      var boxes=document.querySelectorAll('.box:not(.nav-box)');
      for(var i=0;i<boxes.length;i++){
        var rc=boxes[i].getBoundingClientRect(); if(!rc.width) continue;
        R=mb(seed*97+i*613+5);
        var bx=(rc.left+rc.width/2)-cr.left, by=(rc.top+rc.height/2)-cr.top;
        var hw=rc.width/2, hh=rc.height/2, rr=parseFloat(getComputedStyle(boxes[i]).borderTopLeftRadius)||16;
        var baseAng=Math.atan2(cy-by,cx-bx), a=baseAng+(R()-0.5)*1.0;
        var off=rimPoint(a,hw,hh,rr);
        var px=bx+off.x, py=by+off.y, sc=1.0+R()*0.25;
        somaMain(px,py,sc, Math.atan2(off.y,off.x), 2.3); somaBody(px,py,sc);
        NODES.push({x:px,y:py});
      }
      var gel=document.querySelector('.soma-anchor');
      if(gel){ var gr=gel.getBoundingClientRect(); if(gr.width){
        R=mb(seed*97+999);
        var gx=(gr.right+14)-cr.left, gy=(gr.top+gr.height*0.5)-cr.top;
        somaMain(gx,gy,1.05,0.0,2.0); somaBody(gx,gy,1.05); NODES.push({x:gx,y:gy});
      }}
      var amb=[[.58,.13,.6],[.90,.82,.55],[.12,.86,.5]];
      for(var j=0;j<amb.length;j++){ R=mb(seed*97+3000+j*77);
        var ax=W*amb[j][0], ay=H*amb[j][1], asc=amb[j][2];
        somaMain(ax,ay,asc,null,0); somaBody(ax,ay,asc); NODES.push({x:ax,y:ay}); }
      main.shadowBlur=0;
    }

    function makeLine(ax,ay,bx,by,sn){
      var r=mb(sn), dx=bx-ax, dy=by-ay, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
      var n=Math.max(6,Math.round(L/38)), pts=[];
      for(var i=0;i<=n;i++){ var f=i/n;
        var wob=(i===0||i===n)?0:(r()-0.5)*Math.min(46,L*0.14)*Math.sin(f*Math.PI);
        pts.push({x:ax+dx*f+nx*wob, y:ay+dy*f+ny*wob});
      }
      var seg=[0], tot=0;
      for(var i2=1;i2<pts.length;i2++){ tot+=Math.hypot(pts[i2].x-pts[i2-1].x,pts[i2].y-pts[i2-1].y); seg.push(tot); }
      return {pts:pts,seg:seg,len:tot};
    }
    function ptAt(tr,t){
      var d=Math.max(0,Math.min(1,t))*tr.len, s=tr.seg, P=tr.pts;
      for(var i=1;i<s.length;i++){ if(d<=s[i]){ var f=(d-s[i-1])/((s[i]-s[i-1])||1);
        return {x:P[i-1].x+(P[i].x-P[i-1].x)*f, y:P[i-1].y+(P[i].y-P[i-1].y)*f}; } }
      return P[P.length-1];
    }
    function drawLine(tr,distant){
      var P=tr.pts;
      main.lineCap='round'; main.lineJoin='round'; main.lineWidth=0.9;
      main.shadowBlur=4; main.shadowColor='rgba(120,180,235,0.4)';
      if(distant){
        var g=main.createLinearGradient(P[0].x,P[0].y,P[P.length-1].x,P[P.length-1].y);
        g.addColorStop(0,'rgba(150,200,242,'+(0.18*dim)+')'); g.addColorStop(1,'rgba(150,200,242,0)');
        main.strokeStyle=g;
      } else { main.strokeStyle='rgba(150,200,242,'+(0.15*dim)+')'; }
      main.beginPath(); main.moveTo(P[0].x,P[0].y);
      for(var i=1;i<P.length;i++) main.lineTo(P[i].x,P[i].y);
      main.stroke(); main.shadowBlur=0;
    }
    function buildTracks(W,H){
      anim.tracks=[]; var N=NODES, seen={}, ti=0;
      function add(ax,ay,bx,by,distant){ var tr=makeLine(ax,ay,bx,by,seed*17+(ti++)*101); tr.distant=distant; anim.tracks.push(tr); drawLine(tr,distant); }
      for(var i=0;i<N.length;i++){
        var bi=-1,bd=1e18;
        for(var j=0;j<N.length;j++){ if(j===i)continue; var d=(N[j].x-N[i].x)*(N[j].x-N[i].x)+(N[j].y-N[i].y)*(N[j].y-N[i].y); if(d<bd){bd=d;bi=j;} }
        if(bi<0)continue; var key=Math.min(i,bi)+'_'+Math.max(i,bi); if(seen[key])continue; seen[key]=1;
        add(N[i].x,N[i].y,N[bi].x,N[bi].y,false);
      }
      for(var k=0;k<3&&N.length;k++){ var a=N[(k*2)%N.length], ang=k*2.3+0.7;
        add(a.x,a.y,a.x+Math.cos(ang)*W*0.5,a.y+Math.sin(ang)*H*0.5,true); }
    }
    function compositeBase(){
      main.setTransform(1,0,0,1,0,0); main.clearRect(0,0,canvas.width,canvas.height);
      if(anim.buf) main.drawImage(anim.buf,0,0);
    }
    function drawPulse(tr,t){
      var fade=Math.sin(Math.PI*Math.min(1,Math.max(0,t)));
      for(var k=6;k>=1;k--){ var tt=t-k*0.028; if(tt<0)continue; var pp=ptAt(tr,tt);
        main.fillStyle='rgba(192,226,255,'+(fade*0.05*(7-k))+')';
        main.beginPath(); main.arc(pp.x,pp.y,0.8+0.12*(7-k),0,7); main.fill(); }
      var q=ptAt(tr,t);
      main.shadowBlur=10; main.shadowColor='rgba(150,205,255,'+(0.9*fade)+')';
      main.fillStyle='rgba(228,243,255,'+(0.95*fade)+')';
      main.beginPath(); main.arc(q.x,q.y,2.2,0,7); main.fill(); main.shadowBlur=0;
    }
    function loop(ts){
      compositeBase();
      main.setTransform(anim.dpr,0,0,anim.dpr,0,0);
      for(var i=anim.pulses.length-1;i>=0;i--){ var p=anim.pulses[i];
        var dt=ts-p.last; p.last=ts; p.t+=p.sp*dt;
        if(p.t>=1){ anim.pulses.splice(i,1); continue; }
        drawPulse(p.tr,p.t);
      }
      if(anim.pulses.length){ anim.raf=requestAnimationFrame(loop); }
      else { anim.raf=0; compositeBase(); }
    }
    function spawn(){
      if(anim.tracks.length && anim.pulses.length<2){
        var tr=anim.tracks[(Math.random()*anim.tracks.length)|0];
        anim.pulses.push({tr:tr,t:0,sp:1/(2000+Math.random()*1100),last:performance.now()});
        if(!anim.raf) anim.raf=requestAnimationFrame(loop);
      }
      anim.timer=setTimeout(spawn, 2600+Math.random()*900);
    }
    function stopAnim(){ if(anim.raf)cancelAnimationFrame(anim.raf); if(anim.timer)clearTimeout(anim.timer); anim.raf=0; anim.timer=0; anim.pulses=[]; }

    function draw(){
      stopAnim();
      var dpr=Math.min(window.devicePixelRatio||1,2),
          W=canvas.clientWidth||window.innerWidth,
          H=canvas.clientHeight||window.innerHeight;
      canvas.width=W*dpr; canvas.height=H*dpr;
      main.setTransform(dpr,0,0,dpr,0,0); main.clearRect(0,0,W,H);
      var cr=canvas.getBoundingClientRect();
      R=mb(seed);
      for(var i=0;i<5;i++){ var hx=W*(0.12+R()*0.76),hy=H*R(),hr=170+R()*240;
        var gg=main.createRadialGradient(hx,hy,0,hx,hy,hr);
        gg.addColorStop(0,'rgba(40,90,150,'+(0.10*dim)+')'); gg.addColorStop(1,'transparent');
        main.fillStyle=gg; main.beginPath(); main.arc(hx,hy,hr,0,7); main.fill(); }

      var area=W*H;
      if(!dof){
        ensureTop(W,H,dpr);
        anchoredSomas(W,H,cr);
        buildTracks(W,H);
        var bufc=document.createElement('canvas'); bufc.width=canvas.width; bufc.height=canvas.height;
        bufc.getContext('2d').drawImage(canvas,0,0); anim.buf=bufc;
        anim.W=W; anim.H=H; anim.dpr=dpr;
        if(!reduce){ anim.timer=setTimeout(spawn, 1400); }
      } else {
        if(topX){ topX.setTransform(1,0,0,1,0,0); topX.clearRect(0,0,topC.width,topC.height); }
        var blurredLayer=function(blurPx,alpha,scMin,scMax,count){
          var o=offscreen(W,H,dpr);
          paintNeurons(o.ox,W,H,alpha,scMin,scMax,count,false);
          main.save(); main.setTransform(1,0,0,1,0,0);
          main.filter='blur('+(blurPx*dpr)+'px)';
          main.drawImage(o.oc,0,0);
          main.filter='none'; main.restore();
        };
        blurredLayer(4.0,0.34,0.5,0.75, Math.round(area/150000*7*density));
        blurredLayer(1.6,0.62,0.75,1.0, Math.round(area/150000*5*density));
        var soma=paintNeurons(main,W,H,1.0,1.0,1.35, Math.round(area/150000*3.2*density), true);
        for(var f=0;f<focusN;f++) soma(W*(0.45+R()*0.5),H*(0.18+R()*0.6),1.5+R()*0.6);
        main.shadowBlur=0;
        var vg=main.createRadialGradient(W*0.6,H*0.45,Math.min(W,H)*0.22,W*0.6,H*0.45,Math.max(W,H)*0.78);
        vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(3,6,13,0.85)');
        main.fillStyle=vg; main.fillRect(0,0,W,H);
      }
      main.shadowBlur=0;
    }

    draw();
    var t; window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(draw,150);});
  }

  function init(){ document.querySelectorAll('canvas.neural').forEach(build); }
  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);
})();
