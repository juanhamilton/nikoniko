const SEGMENT_COLORS = [
  '#6366f1', '#22d3ee', '#10b981', '#f59e0b',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316',
  '#06b6d4', '#a3e635', '#e879f9', '#fb923c',
];

export const roulette = {
  canvas: null,
  ctx: null,
  membersList: [],
  originalMembers: [],
  angle: 0,
  spinning: false,
  animFrame: null,
  onWinner: null,

  init(canvasEl, members, onWinner) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');
    this.originalMembers = [...members];
    this.membersList = [...members];
    this.onWinner = onWinner;
    this.angle = 0;
    this.spinning = false;
    this.draw();
  },

  reset() {
    this.membersList = [...this.originalMembers];
    this.angle = 0;
    this.spinning = false;
    this.draw();
  },

  draw() {
    const { canvas, ctx, membersList, angle } = this;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(cx, cy) - 10;
    const n = membersList.length;
    ctx.clearRect(0, 0, W, H);

    if (n === 0) {
      ctx.fillStyle = 'rgba(99,102,241,0.1)';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(99,102,241,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡Todos elegidos!', cx, cy - 10);
      ctx.font = '14px Outfit, sans-serif';
      ctx.fillText('Presiona Reiniciar', cx, cy + 15);
      return;
    }

    const slice = (Math.PI * 2) / n;
    membersList.forEach((name, i) => {
      const start = angle + i * slice;
      const end = start + slice;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + slice / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(11, Math.min(16, 200 / n))}px Outfit, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;
      const label = name.length > 12 ? name.slice(0, 11) + '…' : name;
      ctx.fillText(label, radius - 16, 5);
      ctx.restore();
    });

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
    grad.addColorStop(0, '#818cf8');
    grad.addColorStop(1, '#4f46e5');
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const px = cx + radius + 8;
    ctx.beginPath();
    ctx.moveTo(px + 18, cy);
    ctx.lineTo(px - 2, cy - 12);
    ctx.lineTo(px - 2, cy + 12);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(99,102,241,0.8)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  },

  spin() {
    if (this.spinning || this.membersList.length === 0) return;
    this.spinning = true;
    const extraSpins = (5 + Math.random() * 5) * Math.PI * 2;
    const targetAngle = this.angle + extraSpins;
    const duration = 4000 + Math.random() * 2000;
    const startAngle = this.angle;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.angle = startAngle + (targetAngle - startAngle) * eased;
      this.draw();
      if (progress < 1) {
        this.animFrame = requestAnimationFrame(animate);
      } else {
        this.angle = targetAngle;
        this.spinning = false;
        this.draw();
        this.announceWinner();
      }
    };
    this.animFrame = requestAnimationFrame(animate);
  },

  announceWinner() {
    const n = this.membersList.length;
    if (n === 0) return;
    const slice = (Math.PI * 2) / n;
    const normalized = (((-this.angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor(normalized / slice) % n;
    const winner = this.membersList[index];
    if (this.onWinner) this.onWinner(winner);

    // Eliminar ganador de la ruleta después de 1.2s
    setTimeout(() => {
      this.membersList.splice(index, 1);
      this.angle = 0;
      this.draw();
    }, 1200);
  },
};
