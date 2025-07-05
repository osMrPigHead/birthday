import { delay } from "./utils.js";

export class Firework {
    #y; #radius; #rRatio; #color; #alpha; #vy; #gravity;
    constructor(x, y, radius, rRatio, color, alpha, [v0, v1], gravity) {
        this.x = x;
        this.#y = y;
        this.#radius = radius;
        this.#rRatio = rRatio;
        this.#color = color;
        this.#alpha = alpha;
        this.#vy = -(v0 + Math.random() * (v1-v0));
        this.#gravity = gravity;
    };
    update(dt) {
        this.#y += this.#vy * dt;
        this.#vy += this.#gravity * dt;
        return this.#vy;
    };
    draw() {
        ctx.fillStyle = `rgb(from ${this.#color[0]} r g b / ${this.#alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.#y, this.#radius, 0, TAU);
        ctx.fill();
    };
    get y_r_c_a() {
        return [
            this.#y, this.#radius*this.#rRatio,
            this.#color[this.#color.length * Math.random() >>>0],
            this.#alpha
        ];
    };
}

export class FireworkParticle {
    #x; #y; #radius; #color; #alpha; #exp; #vx; #vy; #gravity; #age;
    constructor(x, y, radius, color, alpha, exp, v0, gravity, age) {
        this.#x = x;
        this.#y = y;
        this.#radius = radius;
        this.#color = color;
        this.#alpha = alpha;
        this.#exp = exp;
        this.#vx = (Math.random() - .5) * v0;
        this.#vy = (Math.random() - .5) * v0;
        this.#gravity = gravity;
        this.#age = Math.random() * age;
    };
    update(dt) {
        this.#x += this.#vx * dt;
        this.#y += this.#vy * dt;
        this.#alpha += (0 - this.#alpha) * dt * this.#exp;
        this.#vy += this.#gravity * dt;
        return this.#age -= dt;
    };
    draw() {
        ctx.fillStyle = `rgb(from ${this.#color} r g b / ${this.#alpha})`;
        ctx.beginPath();
        ctx.arc(this.#x, this.#y, this.#radius, 0, TAU);
        ctx.fill();
    };
}

export function getFireworkAnimator(
    particles_, color, alpha, backgroundLight, backgroundDark,
    ratio, rRatio, exp, vp0, vf, gravity, age, [division0, division1]
) {
    let radius = ratio*.4;
    let particles = [], fireworks = [], running = true;
    for (let particle of particles_) {
        particles.push(new FireworkParticle(
            particle.x, particle.y, radius, color, alpha,
            exp, vp0, gravity, age
        ));
    }
    return {
        stop: () => running = false,
        send: (x, color, alpha) => fireworks.push(new Firework(
            x, HEIGHT, radius, rRatio, color, alpha, vf, gravity
        )),
        clear() {
            ctx.fillStyle = backgroundDark;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        },
        animate() {
            let t0;
            requestAnimationFrame(function anim(t) {
                if (!t0) t0 = t;
                let dt = t - t0;
                ctx.fillStyle = backgroundLight;
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
                let particle;
                for (let i = 0; i < particles.length; i++) {
                    particle = particles[i];
                    if (particle.update(dt) < 0) particles.splice(i--, 1);
                    particle.draw();
                }
                let firework;
                for (let i = 0; i < fireworks.length; i++) {
                    firework = fireworks[i];
                    if (firework.update(dt) > 0) {
                        fireworks.splice(i--, 1);
                        for (let j = 0; j < division0 + Math.random()*(division1-division0); j++)
                            particles.push(new FireworkParticle(
                                firework.x, ...firework.y_r_c_a, exp, vp0, gravity, age
                            ));
                    }
                    firework.draw();
                }
                t0 = t;
                if (running) requestAnimationFrame(anim);
            });
        }
    }
}

export async function generateFireworks(animator, [x0, x1], timespan, color_, [a0, a1], [generation0, generation1]) {
    let generation = generation0 + Math.random() * (generation1 - generation0) >>>0;
    for (let i = 0; i < generation; i++) {
        let color, p = Math.random();
        for (let j = 0; j < color_.length - 1; j++) if (p < color_[j][1]) color= color_[j][0];
        if (!color) color = color_[color_.length - 1];
        animator.send(
            x0 + Math.random()*(x1-x0),
            new Array(color).keys().toArray().map(() => `hsl(${Math.random()*360 >>>0}, 100%, 60%)`),
            a0 + Math.random()*(a1-a0)
        );
        await delay(timespan);
    }
}