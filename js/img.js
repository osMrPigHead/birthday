import { delay, dataForeach, getCropGeometry, getSizedGeometry } from "./utils.js";

export function loadImg(filename, display=false) {
    let img = document.createElement("img");
    img.src = filename;
    if (!display) img.style.display = "none";
    document.body.append(img);
    return new Promise(resolve => img.addEventListener("load", ()=>resolve(img)));
}

export function getImgData(img, geometry, mode=CONTAIN, after=()=>{}) {
    const [width, height, ...area] = geometry;
    tctx.clearRect(0, 0, width, height);
    tctx.drawImage(img, ...getSizedGeometry([img.naturalWidth, img.naturalHeight], geometry, mode));
    // tctx.strokeStyle = "red";
    // tctx.strokeRect(...full);
    // tctx.strokeStyle = "blue";
    // tctx.strokeRect(...crop);
    after();
    return tctx.getImageData(...getCropGeometry(area)).data;
}

export async function getImgDotsData(name, geometry, mode=CONTAIN) {
    let [color, grayscale] = (await Promise.all([
        loadImg(`images/${name}.color.png`),
        loadImg(`images/${name}.grayscale.png`),
    ])).map(img => getImgData(img, geometry, mode, () => img.remove()));
    for (let i = 0; i < color.length; i += 4) {
        color[i+3] = grayscale[i];
    }
    return [name, color];
}

export function* interpolate(frame1, frame2, n) {
    let length = frame1.length;
    for (let i = 1; i <= n; i++) {
        let nx = (n-i)/n, x = i/n
        yield new DataView(new Uint8Array(length)
            .map((_, j) => frame1[j]*nx+frame2[j]*x).buffer);
    }
}

export function draw(img, area, ratio, colored) {
    let color, grayscale;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const r = ratio*.5;
    dataForeach(img, area, ratio, (x, y, state) => {
        color = state >>> 8;
        grayscale = state << 24 >>> 24;
        ctx.beginPath();
        if (colored(x, y)) ctx.fillStyle = '#' + (color + 0x1000000).toString(16).substring(1);
        else ctx.fillStyle = '#000';
        ctx.arc(x, y, (1-grayscale*_255)*r, 0, TAU);
        ctx.fill();
    })
}

export const FINISH = 0;
export const KEEP = 1;
export const ONCE = 2;
export const KILL = 3;
export function getImgAnimator(area, fps, ratio, colorWrapper) {
    const fpms = fps / 1000;
    let keep = FINISH, animating = null;
    return {
        colorWrapper: v => colorWrapper = v,
        kill: () => keep = KILL,
        keepOnce: () => keep = ONCE,
        keep: () => keep = KEEP,
        finish: () => keep = FINISH,
        getAnimating: () => animating,
        async animate(frames, wait=true) {
            if (animating) {
                let keep_ = keep;
                if (!wait && keep !== KILL) keep = ONCE;
                await animating;
                keep = keep_;
            }
            if (keep === KILL) keep = FINISH;
            let t0, i0;
            return animating = new Promise(resolve =>
                requestAnimationFrame(function anim(t) {
                    if (!t0) t0 = t;
                    let i = (t-t0)*fpms >>>0;
                    if (i === i0) return requestAnimationFrame(anim);
                    i0 = i;
                    if (i >= frames.length) i = frames.length-1;
                    let img = frames[i];
                    draw(img, area, ratio, colorWrapper(t));
                    if (keep === KILL || (i === frames.length-1 && !keep)) {
                        animating = null;
                        return resolve();
                    }
                    if (keep === ONCE) keep = FINISH;
                    requestAnimationFrame(anim);
                })
            );
        }
    };
}

export async function getImgSlider(imgs, geometry, mode, fps, ratio, colorWrapper, fade_s, span_ms) {
    const [, , ...area] = geometry;
    imgs = await Promise.all(imgs.map(
        img => getImgDotsData(img, geometry.map(v=>v/ratio), mode)
    ));
    const animator = getImgAnimator(area, fps, ratio, colorWrapper),
        empty = new Uint8Array(imgs[0][1].length).map(() => 128);
    let displaying, alive = true;
    let object = {
        animator,
        displaying: () => displaying,
        async animate() {
            displaying = [imgs[0][0], new DataView(imgs[0][1].buffer)];
            await animator.animate([...interpolate(empty, imgs[0][1], fade_s*fps)]);
            for (let i = 0; alive; i++) {
                await Promise.race([delay(span_ms), alivePromise]);
                if (!alive) {
                    break;
                }
                await animator.animate([...interpolate(
                    imgs[i%imgs.length][1], imgs[(i+1)%imgs.length][1], fade_s*fps
                )], false);
                displaying = [imgs[(i+1)%imgs.length][0], new DataView(imgs[(i+1)%imgs.length][1].buffer)];
            }
        }
    };
    let alivePromise = new Promise(resolve => {
        object = {
            ...object,
            kill() {
                resolve();
                alive = false;
                animator.kill();
            },
            finish() {
                resolve();
                alive = false;
                animator.finish();
            }
        }
    });
    return object;
}
