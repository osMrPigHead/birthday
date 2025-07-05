import { dataForeach, getCropGeometry, shuffle } from "./utils.js";

export function loadSpan(text, font) {
    let span = document.createElement("span");
    span.textContent = text;
    span.style.font = font;
    document.body.appendChild(span);
    return span;
}

export function getTextData(text, font) {
    tctx.font = font;
    tctx.textBaseline = "hanging";
    let span = loadSpan(text, font);
    let [width, height] = [span.offsetWidth, span.offsetHeight];
    span.remove();
    tctx.clearRect(0, 0, width, height);
    tctx.fillText(text, 0, 0);
    return {
        data: new DataView(tctx.getImageData(0, 0, width, height).data.buffer),
        width,
        height
    };
}

export function getDots({ data, width, height }, ratio, [x5, y5]) {
    let area = [
        x5 - width*ratio/2, x5 + width*ratio/2, y5 - height*ratio/2, y5 + height*ratio/2
    ];
    let dots = []
    dataForeach(data, area, ratio, (x, y, state) => {
        if (state << 24 >>> 24) dots.push([x, y]);
    });
    return {
        dots,
        xywh: getCropGeometry(area)
    };
}

export function getTextDots(text, font, ratio, center) {
    return getDots(getTextData(text, font), ratio, center);
}

export class TextParticle {
    #x; #y; #exp; #radius
    constructor(x, y, xywh, exp, radius) {
        let [x0, y0, width, height] = xywh;
        this.#x = x0 + Math.random() * width;
        this.#y = y0 + Math.random() * height;
        this.#exp = exp;
        this.#radius = radius;
        this.x = x;
        this.y = y;
    };
    update(dt) {
        this.#x += (this.x - this.#x) * dt * this.#exp;
        this.#y += (this.y - this.#y) * dt * this.#exp;
    };
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.#x, this.#y, this.#radius, 0, TAU);
        ctx.fill();
    };
}

export function getTextAnimator(ctx, ratio, exp, area, backgroundLight, backgroundDark, foreground) {
    let bgXywh = getCropGeometry(area);
    let oXywh = bgXywh, [x0, y0, width, height] = oXywh;
    let center = [x0 + width/2, y0 + height/2], radius = ratio*.4;
    let running = true, dark = false;
    let particles = [];
    return {
        send(text, font) {
            let { dots, xywh } = getTextDots(text, font, ratio, center);
            dots = shuffle(dots);
            for (let i in dots.length > particles.length ? particles : dots) {
                particles[i].x = dots[i][0];
                particles[i].y = dots[i][1];
            }
            if (dots.length > particles.length)
                for (let dot of dots.slice(particles.length))
                    particles.push(new TextParticle(dot[0], dot[1], oXywh, exp, radius));
            else particles = particles.slice(0, dots.length);
            oXywh = xywh;
            dark = true;
        },
        setBackgroundLight: v => backgroundLight = v,
        setBackgroundDark: v => backgroundDark = v,
        stop: () => running = false,
        getParticles: () => particles,
        animate() {
            let t0;
            requestAnimationFrame(function anim(t) {
                if (!t0) t0 = t;
                let dt = t - t0;
                ctx.fillStyle = dark ? backgroundDark : backgroundLight;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                ctx.fillStyle = foreground;
                dark = false;
                for (let particle of particles) {
                    particle.update(dt);
                    particle.draw(ctx);
                }
                t0 = t;
                if (running) requestAnimationFrame(anim);
            });
        }
    };
}