class WeatherCanvas {
  constructor(id = 'weather-canvas') {
    this.canvas = document.getElementById(id);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = []; this.mode = 'clear'; this.isDay = true; this.raf = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  setMode(wid, isDay) {
    this.isDay = isDay; this.particles = [];
    if (wid>=200&&wid<300) this.mode='thunderstorm';
    else if (wid>=300&&wid<400) this.mode='drizzle';
    else if (wid>=500&&wid<600) this.mode='rain';
    else if (wid>=600&&wid<700) this.mode='snow';
    else if (wid>=700&&wid<800) this.mode='fog';
    else if (wid===800) this.mode=isDay?'clear':'stars';
    else this.mode='clouds';
    this.init();
  }
  init() {
    const W=this.canvas.width, H=this.canvas.height;
    if (this.mode==='rain'||this.mode==='drizzle') {
      const n=this.mode==='rain'?200:70;
      for (let i=0;i<n;i++) this.particles.push({x:Math.random()*W,y:Math.random()*H,vy:8+Math.random()*10,vx:-1+Math.random()*.5,len:12+Math.random()*18,op:.2+Math.random()*.5,w:.5+Math.random()*.8});
    } else if (this.mode==='snow') {
      for (let i=0;i<120;i++) this.particles.push({x:Math.random()*W,y:Math.random()*H,r:1.5+Math.random()*3,vy:.5+Math.random()*1.5,vx:-.5+Math.random(),wob:Math.random()*Math.PI*2,ws:.01+Math.random()*.03,op:.4+Math.random()*.5});
    } else if (this.mode==='thunderstorm') {
      for (let i=0;i<250;i++) this.particles.push({x:Math.random()*W,y:Math.random()*H,vy:14+Math.random()*8,vx:-2+Math.random(),len:18+Math.random()*20,op:.25+Math.random()*.4,w:.8,type:'rain'});
      this.lightning={active:false,timer:0,interval:180+Math.random()*240};
    } else if (this.mode==='fog') {
      for (let i=0;i<8;i++) this.particles.push({x:Math.random()*W,y:Math.random()*H,w:300+Math.random()*400,h:80+Math.random()*120,vx:.2+Math.random()*.4,op:.04+Math.random()*.06});
    } else if (this.mode==='stars') {
      for (let i=0;i<200;i++) this.particles.push({x:Math.random()*W,y:Math.random()*H*.8,r:.5+Math.random()*1.5,op:.3+Math.random()*.7,t:Math.random()*Math.PI*2,ts:.01+Math.random()*.03});
    } else if (this.mode==='clouds') {
      for (let i=0;i<5;i++) this.particles.push({x:Math.random()*W,y:50+Math.random()*200,w:200+Math.random()*300,h:60+Math.random()*80,vx:.15+Math.random()*.25,op:.04+Math.random()*.06});
    } else {
      for (let i=0;i<30;i++) this.particles.push({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*2,vx:-.2+Math.random()*.4,vy:-.3+Math.random()*.2,mop:.1+Math.random()*.3,ph:Math.random()*Math.PI*2});
    }
  }
  draw() {
    if (!this.canvas) return;
    const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
    ctx.clearRect(0,0,W,H);
    if (this.mode==='rain'||this.mode==='drizzle') {
      this.particles.forEach(p => {
        ctx.beginPath(); ctx.strokeStyle=`rgba(147,210,255,${p.op})`; ctx.lineWidth=p.w;
        ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.vx*3,p.y+p.len); ctx.stroke();
        p.x+=p.vx; p.y+=p.vy; if(p.y>H){p.y=-p.len;p.x=Math.random()*W;}
      });
    } else if (this.mode==='snow') {
      this.particles.forEach(p => {
        p.wob+=p.ws; p.x+=p.vx+Math.sin(p.wob)*.5; p.y+=p.vy;
        if(p.y>H){p.y=-5;p.x=Math.random()*W;} if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*2);
        g.addColorStop(0,`rgba(255,255,255,${p.op})`); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2,0,Math.PI*2); ctx.fill();
      });
    } else if (this.mode==='thunderstorm') {
      this.particles.forEach(p => {
        ctx.beginPath(); ctx.strokeStyle=`rgba(147,210,255,${p.op})`; ctx.lineWidth=p.w;
        ctx.moveTo(p.x,p.y); ctx.lineTo(p.x+p.vx*3,p.y+p.len); ctx.stroke();
        p.x+=p.vx; p.y+=p.vy; if(p.y>H){p.y=-p.len;p.x=Math.random()*W;}
      });
      if (this.lightning) {
        this.lightning.timer++;
        if (this.lightning.timer>=this.lightning.interval) {
          this.lightning.active=true; this.lightning.timer=0; this.lightning.dur=0;
          this.lightning.interval=120+Math.random()*300; this.lightning.x=W*.2+Math.random()*W*.6;
        }
        if (this.lightning.active) {
          this.lightning.dur=(this.lightning.dur||0)+1;
          if (this.lightning.dur<8) {
            ctx.save(); ctx.globalAlpha=.7-this.lightning.dur*.08;
            ctx.strokeStyle='#e0e7ff'; ctx.lineWidth=2; ctx.shadowColor='#818cf8'; ctx.shadowBlur=20;
            ctx.beginPath(); let lx=this.lightning.x,ly=0;
            while(ly<H*.6){ctx.moveTo(lx,ly);lx+=-20+Math.random()*40;ly+=30+Math.random()*40;ctx.lineTo(lx,ly);}
            ctx.stroke(); ctx.restore();
          } else { this.lightning.active=false; }
        }
      }
    } else if (this.mode==='fog'||this.mode==='clouds') {
      this.particles.forEach(p => {
        p.x+=p.vx; if(p.x>W+p.w)p.x=-p.w;
        const g=ctx.createRadialGradient(p.x+p.w/2,p.y+p.h/2,0,p.x+p.w/2,p.y+p.h/2,Math.max(p.w,p.h));
        g.addColorStop(0,`rgba(255,255,255,${p.op*2})`); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(p.x+p.w/2,p.y+p.h/2,p.w/2,p.h/2,0,0,Math.PI*2); ctx.fill();
      });
    } else if (this.mode==='stars') {
      this.particles.forEach(p => {
        p.t+=p.ts; const op=p.op*(0.5+0.5*Math.sin(p.t));
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
        g.addColorStop(0,`rgba(255,255,255,${op})`); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2); ctx.fill();
      });
    } else {
      this.particles.forEach(p => {
        p.ph+=.01; p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1;
        const op=p.mop*(0.5+0.5*Math.sin(p.ph));
        const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
        g.addColorStop(0,`rgba(56,189,248,${op})`); g.addColorStop(1,'transparent');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*4,0,Math.PI*2); ctx.fill();
      });
    }
  }
  start() {
    const loop=()=>{ this.draw(); this.raf=requestAnimationFrame(loop); };
    if(this.raf) cancelAnimationFrame(this.raf);
    loop();
  }
  stop() { if(this.raf) cancelAnimationFrame(this.raf); }
}

let _wc;
function initWeatherCanvas() { _wc = new WeatherCanvas('weather-canvas'); _wc.start(); }
function setWeatherAnimation(wid, isDay) {
  if (localStorage.getItem('skycast_pref_animations') === '0') return;
  if (!_wc) initWeatherCanvas();
  _wc.setMode(wid, isDay);
}
