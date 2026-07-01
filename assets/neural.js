(function(){
  function mb(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function build(canvas){
    var seed=+canvas.dataset.seed||7,
        density=parseFloat(canvas.dataset.density||"1"),
        dim=parseFloat(canvas.dataset.dim||"1"),
        focusN=canvas.dataset.focus!=null?+canvas.dataset.focus:2,
        dof=canvas.dataset.dof!=null?+canvas.dataset.dof:1;
    var main=canvas.getContext('2d'), R;
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
      ctx.shadowBlur=0;
      return soma;
    }
    function offscreen(W,H,dpr){
      var oc=document.createElement('canvas'); oc.width=W*dpr; oc.height=H*dpr;
      var ox=oc.getContext('2d'); ox.setTransform(dpr,0,0,dpr,0,0);
      return {oc:oc,ox:ox};
    }
    function draw(){
      var dpr=Math.min(window.devicePixelRatio||1,2),
          W=canvas.clientWidth||window.innerWidth,
          H=canvas.clientHeight||window.innerHeight;
      canvas.width=W*dpr; canvas.height=H*dpr;
      main.setTransform(dpr,0,0,dpr,0,0); main.clearRect(0,0,W,H);
      R=mb(seed);
      for(var i=0;i<5;i++){ var hx=W*(-0.02+R()*0.75),hy=H*R(),hr=170+R()*240;
        var gg=main.createRadialGradient(hx,hy,0,hx,hy,hr);
        gg.addColorStop(0,'rgba(40,90,150,'+(0.10*dim)+')'); gg.addColorStop(1,'transparent');
        main.fillStyle=gg; main.beginPath(); main.arc(hx,hy,hr,0,7); main.fill(); }
      if(!dof){
        var FS=[[.26,.42,1.1],[.52,.74,1.0],[.18,.88,.85],[.63,.36,.8],[.40,1.06,.78],[.69,.60,.95],[.32,.64,.7]];
        paintNeurons(main,W,H,1.0,1,1.35,0,true,FS);
        main.shadowBlur=0;
        return;
      }
      var area=W*H;
      function blurredLayer(blurPx,alpha,scMin,scMax,count){
        var o=offscreen(W,H,dpr);
        paintNeurons(o.ox,W,H,alpha,scMin,scMax,count,false);
        main.save(); main.setTransform(1,0,0,1,0,0);
        main.filter='blur('+(blurPx*dpr)+'px)';
        main.drawImage(o.oc,0,0);
        main.filter='none'; main.restore();
      }
      blurredLayer(4.0,0.34,0.5,0.75, Math.round(area/150000*7*density));
      blurredLayer(1.6,0.62,0.75,1.0, Math.round(area/150000*5*density));
      var soma=paintNeurons(main,W,H,1.0,1.0,1.35, Math.round(area/150000*3.2*density), true);
      for(var f=0;f<focusN;f++) soma(W*(0.45+R()*0.5),H*(0.18+R()*0.6),1.5+R()*0.6);
      main.shadowBlur=0;
      var vg=main.createRadialGradient(W*0.6,H*0.45,Math.min(W,H)*0.22,W*0.6,H*0.45,Math.max(W,H)*0.78);
      vg.addColorStop(0,'transparent'); vg.addColorStop(1,'rgba(3,6,13,0.85)');
      main.fillStyle=vg; main.fillRect(0,0,W,H);
    }
    draw();
    var t; window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(draw,150);});
  }
  function init(){ document.querySelectorAll('canvas.neural').forEach(build); }
  if(document.readyState!=='loading') init();
  else document.addEventListener('DOMContentLoaded',init);
})();
