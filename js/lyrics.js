import { getTextAnimator } from "./text.js";

export async function getLyrics(url) {
    let arr;
    let m, s;
    return (await (await fetch(url)).text()).split("\n").map(line => {
        if (!(line = line.trim()).startsWith("[")) return null;
        [m, s] = (arr = line.split("]"))[0].substring(1).split(":").map(Number);
        return {
            time: m*60+s,
            text: arr.slice(1).join("]")
        };
    }).filter(v => v);
}

export function getLyricsAnimator(lyrics, font, ratio, exp, area, backgroundLight, backgroundDark, foreground) {
    let textAnimator = getTextAnimator(lctx, ratio, exp, area,
        backgroundLight, backgroundDark, foreground);
    let running = true;
    return {
        setBackgroundLight: textAnimator.setBackgroundLight,
        setBackgroundDark: textAnimator.setBackgroundDark,
        stop() {
            running = false;
            textAnimator.stop();
        },
        animate() {
            textAnimator.animate();
            let t0, i = -1;
            requestAnimationFrame(function anim(t) {
                if (!t0) t0 = t;
                let j = -1;
                for (; lyrics[j+1].time < (t-t0)/1000; j++) {}
                if (j !== i) {
                    i = j;
                    textAnimator.send(lyrics[j].text, font);
                    console.log(lyrics[j].text);
                }
                if (running) requestAnimationFrame(anim);
            });
        }
    };
}