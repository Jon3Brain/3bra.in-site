/* 3bra.in neural field — anchored somas (home) + depth-of-field field (content pages).
   Home: each memory box hosts a soma integrated INTO its edge — dendrites drawn behind the
   box, the soma cell-body drawn on a layer ABOVE the box so it straddles/attaches to the rim.
   One soma pinned near "guardrailed"; a few faint ambient somas. Map capped to site max-width. */
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

    /* ---- top layer for soma bodies (drawn ABOVE the boxes) ---- */
    function ensureTop(W,H,dpr){
      if(!topC){
        topC=document.createElement('canvas'); topC.setAttribute('aria-hidden','true');
        topC.style.cssText='position:fixed;inset:0;width:100%;height:100%;max-width:var(--maxw);margin-inline:auto;z-index:4;pointer-events:none;display:block;';
        document.body.appendChild(topC); topX=topC.getContext('2d');
      }
      topC.width=W*dpr; topC.height=H*dpr; topX.setTransform(dpr,0,0,dpr,0,0); topX.clearRect(0,0,W,H);
      return topX;
    }

    /* ---- anchored somas (home) ---- */
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
    // halo + dendrites on the BACKGROUND canvas
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
    // defined cell body on the TOP layer (sits on the box edge)
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
      main.lineCap='round'; main.lineJoin='round';
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
        somaMain(px,py,sc, Math.atan2(off.y,off.x), 2.3);   // halo + dendrites (behind box)
        somaBody(px,py,sc);                                  // cell body (on top of box edge)
      }
      var gel=document.querySelector('.soma-anchor');
      if(gel){ var gr=gel.getBoundingClientRect(); if(gr.width){
        R=mb(seed*97+999);
        var gx=(gr.right+14)-cr.left, gy=(gr.top+gr.height*0.5)-cr.top;
        somaMain(gx,gy,1.05,0.0,2.0); somaBody(gx,gy,1.05);
      }}
      var amb=[[.58,.13,.6],[.90,.82,.55],[.12,.86,.5]];
      for(var j=0;j<amb.length;j++){ R=mb(seed*97+3000+j*77);
        var ax=W*amb[j][0], ay=H*amb[j][1], asc=amb[j][2];
        somaMain(ax,ay,asc,null,0); somaBody(ax,ay,asc); }
      main.shadowBlur=0;
    }

    function draw(){
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
