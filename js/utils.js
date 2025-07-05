export function delay(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

export function onanimationend(element) {
    return new Promise(resolve =>
        element.addEventListener("animationend", function listener(...arr) {
            element.removeEventListener("animationend", listener);
            resolve(...arr);
        })
    );
}

export function onanimationstart(element) {
    return new Promise(resolve =>
        element.addEventListener("animationstart", function listener(...arr) {
            element.removeEventListener("animationstart", listener);
            resolve(...arr);
        })
    );
}

export function onplay(element) {
    return new Promise(resolve =>
        element.addEventListener("play", function listener(...arr) {
            element.removeEventListener("play", listener);
            resolve(...arr);
        })
    );
}

export function refresh(element) {
    void element.offsetWidth;
}

export function getCropGeometry([x0, x1, y0, y1]) {
    return [x0, y0, x1-x0, y1-y0];
}

export function getSizedGeometry([srcWidth, srcHeight], [width, height, x0, x1, y0, y1], mode=CONTAIN) {
    if (mode === FILL) return [0, 0, width, height];
    let iWH = srcWidth / srcHeight, tWH = width / height,
        [realWidth, realHeight] = [
            (mode === CONTAIN ? iWH > tWH : iWH < tWH) ? width : height * iWH,
            (mode === CONTAIN ? iWH > tWH : iWH < tWH) ? width / iWH : height,
        ];
    return [(width-realWidth)/2, (height-realHeight)/2, realWidth, realHeight];
}

export function easeInOut(t) {
    return t*t*(3-2*t);
}

export function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

export function dataForeach(data, [x0, x1, y0, y1], ratio, f) {
    let i = 0;
    for (let y = y0; y < y1; y += ratio) for (let x = x0; x < x1; x += ratio) {
        f(x, y, data.getUint32(i));
        i += 4;
    }
}
