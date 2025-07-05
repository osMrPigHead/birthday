import { onanimationend, onanimationstart, onplay, easeInOut, refresh, delay } from "./utils.js";
import { getLyrics, getLyricsAnimator } from "./lyrics.js";
import { getImgSlider } from "./img.js";
import { getTextAnimator } from "./text.js";
import { generateFireworks, getFireworkAnimator } from "./firework.js";
import { d3init } from "./d3.js";

let lyricsAnimator;

async function lyricsDisplay() {
    lyricsAnimator = getLyricsAnimator(await getLyrics(LYRICS_URL),
        LYRICS_FONT, LYRICS_RATIO, LYRICS_EXP, LYRICS_AREA,
        TEXT_BACKGROUND_LIGHT, TEXT_BACKGROUND_DARK, LYRICS_FOREGROUND);
    await onplay(document.querySelector("#music"));
    lcan.style.display = "block";
    lyricsAnimator.animate();
}

async function imgDisplay() {
    let start = document.querySelector("#start");
    let slider = await getImgSlider(
        IMGS, IMG_GEOMETRY, IMG_MODE,
        IMG_FPS, IMG_RATIO, () => () => false, IMG_FADE_S, IMG_SPAN_MS
    );
    document.body.style.opacity = "1";
    document.addEventListener("click", function listener() {
        document.removeEventListener("click", listener);
        start.style.animation = "";
        refresh(start);
        start.style.animation = "fade 1s both reverse .5s";
        slider.animator.keep();
        let t1 = performance.now();
        slider.animator.colorWrapper(t => {
            let k = easeInOut((t-t1)/IMG_COLOR_MS), nk = 1-k, c = IMG_C0 * nk + IMG_C1 * k;
            if (t-t1 > IMG_COLOR_MS) {
                slider.animator.colorWrapper(() => () => true);
                slider.finish();
                return () => true;
            }
            return (x, y) => y - x - c < 0;
        });
        if (!slider.animator.getAnimating()) slider.animator.animate([slider.displaying()[1]]);
    });
    start.style.animation = "fade .75s both .5s";
    await slider.animate();
    document.title = "Happy Birthday!";
    let img = document.createElement("div");
    img.style.backgroundImage = `url("images/${slider.displaying()[0]}.source.png")`;
    img.style.backgroundPosition = "center";
    img.style.backgroundSize = "cover"
    img.style.position = "fixed";
    [img.style.left, img.style.top, img.style.width, img.style.height] =
        [0, 0, WIDTH, HEIGHT].map(v=>v+"px");
    document.body.append(img);
    img.style.animation = `slide-in ${IMG_ANIM_S}s both ${IMG_COLOR_SPAN_S}s,
        slide-out ${IMG_ANIM_S}s forwards ${IMG_ANIM_DELAY_S}s`;
    await onanimationend(img);
    document.querySelector("#music").play();
    await onanimationstart(img);
}

async function textDisplay() {
    document.body.style.background = TEXT_BACKGROUND;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    let animator = getTextAnimator(
        ctx, TEXT_RATIO, TEXT_EXP, TEXT_AREA,
        TEXT_BACKGROUND_LIGHT, TEXT_BACKGROUND_DARK, TEXT_FOREGROUND
    );
    animator.animate();
    for (let text of TEXTS) {
        animator.send(...text);
        await delay(text[2]);
    }
    animator.stop();
    document.body.style.background = TRANSITION_BACKGROUND;
    lyricsAnimator.setBackgroundLight(TRANSITION_BACKGROUND_LIGHT);
    lyricsAnimator.setBackgroundDark(TRANSITION_BACKGROUND_DARK);
    animator = getTextAnimator(
        ctx, TEXT_RATIO, TRANSITION_EXP, [-WIDTH, 2*WIDTH, -HEIGHT, 2*HEIGHT],
        TRANSITION_BACKGROUND_LIGHT, TRANSITION_BACKGROUND_DARK, TRANSITION_FOREGROUND
    );
    animator.animate();
    await delay(TRANSITION_DELAY);
    animator.send(...TRANSITION_TEXT);
    await delay(TRANSITION_SPAN);
    animator.stop();
    return animator.getParticles();
}

async function fireworkDisplay(particles) {
    document.body.style.background = FIREWORK_BACKGROUND;
    lyricsAnimator.setBackgroundLight(FIREWORK_BACKGROUND_LIGHT);
    lyricsAnimator.setBackgroundDark(FIREWORK_BACKGROUND_DARK);
    let animator = getFireworkAnimator(
        particles, TRANSITION_FOREGROUND, 1, FIREWORK_BACKGROUND_LIGHT, FIREWORK_BACKGROUND_DARK,
        FIREWORK_RATIO, FIREWORK_R_RATIO,
        FIREWORK_EXP, FIREWORK_VP0, FIREWORK_VF, FIREWORK_GRAVITY, FIREWORK_MAX_AGE_MS, FIREWORK_DIVISION
    );
    animator.animate();
    document.querySelector("#happy").style.animation = `push-up 1s both ${FIREWORK_HAPPY_DELAY}ms`;
    let div, container = document.querySelector("#words-container");
    for (let i = 0; i < FIREWORK_TEXT.length; i++) {
        div = document.createElement("div");
        div.innerHTML = FIREWORK_TEXT[i];
        div.classList.add("line");
        div.style.animation = `push-up 1s both ${FIREWORK_HAPPY_DELAY+(i+1)*FIREWORK_HAPPY_SPAN}ms`;
        container.appendChild(div);
    }
    let eLink = document.querySelector("#link");
    eLink.style.animation =
        `push-up 1s both ${FIREWORK_HAPPY_DELAY+(FIREWORK_TEXT.length+1)*FIREWORK_HAPPY_SPAN}ms`;
    eLink.onclick = () => {
        let gContainer = document.querySelector("#g-container-container");
        gContainer.style.display = "block";
        gContainer.style.animation = "fade-04 1s both";
        d3init();
    };
    while (true) {
        await delay(FIREWORK_DELAY);
        animator.clear();
        await generateFireworks(animator, FIREWORK_X, FIREWORK_TIMESPAN,
            FIREWORK_COLOR, FIREWORK_ALPHA, FIREWORK_GENERATION);
    }
}

async function main() {
    await imgDisplay();
    await fireworkDisplay(await textDisplay());
}

window.onload = () => {
    lyricsDisplay();
    main();
};