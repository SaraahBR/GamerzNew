import {
  Component, AfterViewInit, OnDestroy,
  ViewChild, ElementRef, Inject, PLATFORM_ID, NgZone, ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimationService } from '../../services/animation.service';
import { CanvasService } from '../../services/canvas.service';

interface Star  { x:number; y:number; r:number; alpha:number; phase:number; speed:number; }
interface Particle {
  kind:'star'|'planet'; x:number; y:number; vx:number; vy:number;
  life:number; decay:number; r:number; color:string;
  cross?:boolean; ring?:boolean; ringAngle?:number;
}
interface Constellation {
  x:number; y:number; vx:number; vy:number; life:number; decay:number;
  pts:[number,number][]; edges:[number,number][];
}

const SHAPES: {pts:[number,number][];edges:[number,number][]}[] = [
  { pts:[[0,-14],[12,8],[-12,8]],         edges:[[0,1],[1,2],[2,0]] },
  { pts:[[-14,0],[-5,0],[5,0],[14,0]],    edges:[[0,1],[1,2],[2,3]] },
  { pts:[[0,-12],[10,0],[0,12],[-10,0]],  edges:[[0,1],[1,2],[2,3],[3,0]] },
  { pts:[[0,0],[8,-10],[16,-8],[20,0]],   edges:[[0,1],[1,2],[2,3]] },
  { pts:[[-8,-8],[0,-14],[8,-8],[10,0],[5,10],[-5,10],[-10,0]], edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]] },
];

// Seletores SEMPRE bloqueados (navbar + footer), independente da página
const GLOBAL_BLOCK = '.gn-header, .gn-footer, app-header, app-footer';

@Component({
  selector: 'app-galaxy-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/component-max-inline-declarations
  template:
    '<canvas #galaxyCanvas class="galaxy-canvas" aria-hidden="true"></canvas>' +
    '<canvas #particleCanvas class="particle-canvas" aria-hidden="true"></canvas>',
  styleUrls: ['./galaxy-canvas.component.css']
})
export class GalaxyCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('galaxyCanvas') bgRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('particleCanvas') pRef!: ElementRef<HTMLCanvasElement>;

  private ctx!:  CanvasRenderingContext2D;
  private pCtx!: CanvasRenderingContext2D;
  private raf = 0;
  private W = 0; private H = 0;
  private bgStars: Star[] = [];
  private particles: Particle[] = [];
  private constellations: Constellation[] = [];
  private mx = -999; private my = -999;
  private pmx = -999; private pmy = -999;
  private constellationTimer = 0;

  // Handlers para limpar eventos dps
  private onMouseBind = this.onMouse.bind(this);
  private onResizeBind = this.onResize.bind(this);

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private animSvc: AnimationService,
    private canvasSvc: CanvasService,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ctx  = this.bgRef.nativeElement.getContext('2d', { alpha: false })!;
    this.pCtx = this.pRef.nativeElement.getContext('2d')!;
    this.resize();
    this.genStars();

    // Roda os listeners e o loop fora do Angular para não disparar Change Detection! (Gigante ganho de performance)
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onMouseBind, { passive: true });
      window.addEventListener('resize', this.onResizeBind, { passive: true });
      this.loop();
    });
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.raf);
      document.removeEventListener('mousemove', this.onMouseBind);
      window.removeEventListener('resize', this.onResizeBind);
    }
  }

  private onMouse(e: MouseEvent) { this.mx = e.clientX; this.my = e.clientY; }

  private onResize() {
    this.resize(); this.genStars();
  }

  private resize() {
    const bg = this.bgRef.nativeElement;
    const pc = this.pRef.nativeElement;
    this.W = bg.width = pc.width = window.innerWidth;
    this.H = bg.height = pc.height = window.innerHeight;
  }

  private genStars() {
    this.bgStars = Array.from({ length: 200 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.pow(Math.random(), 2.5) * 2.2 + 0.2,
      alpha: Math.random() * 0.7 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.9 + 0.2,
    }));
  }

  // ── EMISSÃO ──────────────────────────────────

  private emit() {
    const cfg = this.canvasSvc.cfg();
    if (!cfg.particles || !this.animSvc.enabled()) return;

    // Bloqueia se mouse está sobre navbar, footer ou elementos da página
    const blockSel = [GLOBAL_BLOCK, cfg.exclusions].filter(Boolean).join(', ');
    const elUnder = document.elementFromPoint(this.mx, this.my);
    if (elUnder?.closest?.(blockSel)) return;

    const moved = Math.abs(this.mx - this.pmx) + Math.abs(this.my - this.pmy) > 1;
    if (!moved || this.mx < 0) return;

    const count = Math.random() < 0.45 ? 1 : 2;
    for (let i = 0; i < count; i++) {
      const isPlanet = Math.random() < 0.10;
      const angle = Math.random() * Math.PI * 2;
      const spd   = Math.random() * 0.55 + 0.1;
      const roll  = Math.random();
      const color = roll < 0.6 ? '255,255,255' : roll < 0.8 ? '255,155,215' : '190,135,255';
      this.particles.push({
        kind: isPlanet ? 'planet' : 'star',
        x: this.mx + (Math.random()-0.5)*8,
        y: this.my + (Math.random()-0.5)*8,
        vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 0.25,
        life: 1, decay: Math.random()*0.015+0.008,
        r: isPlanet ? Math.random()*2.5+1.5 : Math.random()*1.1+0.35,
        color,
        cross: !isPlanet && Math.random() < 0.22,
        ring: isPlanet && Math.random() < 0.65,
        ringAngle: Math.random() * Math.PI,
      });
    }

    this.constellationTimer--;
    if (this.constellationTimer <= 0) {
      this.constellationTimer = Math.floor(Math.random()*50+35);
      const tmpl  = SHAPES[Math.floor(Math.random()*SHAPES.length)];
      const scale = Math.random()*0.55+0.6;
      this.constellations.push({
        x: this.mx + (Math.random()-0.5)*30,
        y: this.my + (Math.random()-0.5)*30,
        vx: (Math.random()-0.5)*0.25, vy: -Math.random()*0.18-0.05,
        life: 1, decay: Math.random()*0.008+0.005,
        pts:   tmpl.pts.map(([x,y])=>[x*scale,y*scale] as [number,number]),
        edges: tmpl.edges,
      });
    }
  }

  // ── LOOP ──────────────────────────────────────

  private loop() {
    const { ctx, pCtx, W, H } = this;
    const t = Date.now() * 0.001;

    this.emit();
    this.pmx = this.mx; this.pmy = this.my;

    // Fundo
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#04000c';
    ctx.fillRect(0, 0, W, H);

    if (this.animSvc.enabled()) {
      const bg = ctx.createRadialGradient(W/2,H*0.25,0,W/2,H/2,Math.max(W,H)*0.85);
      bg.addColorStop(0,   'rgba(24,4,54,0.95)');
      bg.addColorStop(0.6, 'rgba(8,0,22,0.5)');
      bg.addColorStop(1,   'transparent');
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

      const hue = 285 + 30*Math.sin(t*0.2);
      for (let i=0;i<3;i++) {
        const cy = H*(0.38+i*0.22)+55*Math.sin(t*0.15+i*1.3);
        const aG = ctx.createLinearGradient(0,cy-130,0,cy+130);
        aG.addColorStop(0,'transparent');
        aG.addColorStop(0.5,`hsla(${hue+i*28},90%,58%,0.04)`);
        aG.addColorStop(1,'transparent');
        ctx.fillStyle=aG; ctx.fillRect(0,0,W,H);
      }
      this.fog(ctx,W*0.08,H*0.12,380,'rgba(200,20,80,0.07)');
      this.fog(ctx,W*0.92,H*0.85,340,'rgba(130,20,220,0.06)');
      this.fog(ctx,W*0.50,H*0.60,220,'rgba(80,0,180,0.04)');

      for (const s of this.bgStars) {
        const a = s.alpha*(0.3+0.7*Math.abs(Math.sin(t*s.speed+s.phase)));
        if (s.r>1.5) {
          ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.r*3,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,210,255,${(a*0.08).toFixed(3)})`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${a.toFixed(3)})`; ctx.fill();
      }
    }

    // Partículas
    pCtx.clearRect(0,0,W,H);

    for (let i=this.constellations.length-1;i>=0;i--) {
      const c=this.constellations[i];
      c.life-=c.decay; if(c.life<=0){this.constellations.splice(i,1);continue;}
      c.x+=c.vx; c.y+=c.vy;
      this.drawConst(pCtx,c);
    }
    for (let i=this.particles.length-1;i>=0;i--) {
      const p=this.particles[i];
      p.life-=p.decay; if(p.life<=0){this.particles.splice(i,1);continue;}
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.007;
      this.drawParticle(pCtx,p);
    }

    this.raf = requestAnimationFrame(()=>this.loop());
  }

  // ── DRAW ─────────────────────────────────────

  private drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    const a = Math.pow(p.life,1.6);
    if (p.kind==='planet') {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color},${(a*.08).toFixed(3)})`; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color},${(a*.75).toFixed(3)})`; ctx.fill();
      if (p.ring) {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.ringAngle!);
        ctx.beginPath(); ctx.ellipse(0,0,p.r*2.6,p.r*.7,0,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${p.color},${(a*.35).toFixed(3)})`;
        ctx.lineWidth=.7; ctx.stroke(); ctx.restore();
      }
    } else if (p.cross) {
      const len = p.r*4*p.life;
      ctx.save(); ctx.globalAlpha=a*.85;
      ctx.strokeStyle=`rgba(${p.color},1)`; ctx.lineWidth=.8;
      ctx.beginPath();
      ctx.moveTo(p.x-len,p.y); ctx.lineTo(p.x+len,p.y);
      ctx.moveTo(p.x,p.y-len); ctx.lineTo(p.x,p.y+len);
      ctx.stroke(); ctx.restore();
    } else {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r*2.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color},${(a*.10).toFixed(3)})`; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${p.color},${a.toFixed(3)})`; ctx.fill();
    }
  }

  private drawConst(ctx: CanvasRenderingContext2D, c: Constellation) {
    const a = Math.pow(c.life,1.8);
    ctx.save();
    ctx.strokeStyle=`rgba(200,185,255,${(a*.22).toFixed(3)})`;
    ctx.lineWidth=.5; ctx.setLineDash([2,3]);
    for (const [i,j] of c.edges) {
      ctx.beginPath();
      ctx.moveTo(c.x+c.pts[i][0],c.y+c.pts[i][1]);
      ctx.lineTo(c.x+c.pts[j][0],c.y+c.pts[j][1]);
      ctx.stroke();
    }
    ctx.setLineDash([]); ctx.restore();
    for (const [dx,dy] of c.pts) {
      ctx.beginPath(); ctx.arc(c.x+dx,c.y+dy,3.5,0,Math.PI*2);
      ctx.fillStyle=`rgba(220,210,255,${(a*.15).toFixed(3)})`; ctx.fill();
      ctx.beginPath(); ctx.arc(c.x+dx,c.y+dy,1.2,0,Math.PI*2);
      ctx.fillStyle=`rgba(240,230,255,${(a*.9).toFixed(3)})`; ctx.fill();
    }
  }

  private fog(ctx: CanvasRenderingContext2D,x:number,y:number,r:number,color:string) {
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,color); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,0,this.W,this.H);
  }
}
