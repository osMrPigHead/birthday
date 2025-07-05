import * as THREE from "three";
import * as UTILS from "./utils.js";
import * as IMG from "./img.js";

const px = 2*D3_IMG_DISTANCE*Math.tan(D3_IMG_FOV/360*Math.PI)/HEIGHT;
const material = new THREE.ShaderMaterial({
    uniforms: {
        diam: { value: D3_IMG_RATIO * D3_IMG_DISTANCE }
    },
    vertexShader: document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
    vertexColors: true
});
const imgSize = (D3_IMG_Y1-D3_IMG_Y0) * (D3_IMG_X1-D3_IMG_X0) / D3_IMG_RATIO / D3_IMG_RATIO;
const heartSize = 4 * D3_HEART_THETA * D3_HEART_THICKNESS;

const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(D3_IMG_FOV, WIDTH / HEIGHT, 1, 10000),
    clock = new THREE.Clock(),
    renderer = new THREE.WebGLRenderer({ antialias: true });

let imgs;
let imgAlpha = new Float32Array(imgSize),
    imgHeartShuffle = new Uint8Array(imgSize);
let imgSrc = new Float32Array(imgSize*3),
    imgPosition = new Float32Array(imgSize*3),
    imgColor = new Float32Array(imgSize*3),
    imgScale = new Float32Array(imgSize);
let imgGeometry = new THREE.BufferGeometry()
        .setAttribute("position", new THREE.BufferAttribute(imgPosition, 3))
        .setAttribute("color", new THREE.BufferAttribute(imgColor, 3))
        .setAttribute("scale", new THREE.BufferAttribute(imgScale, 1)),
    imgMaterial = material.clone(),
    imgPoints = new THREE.Points(imgGeometry, imgMaterial);
let heartDst = new Float32Array(heartSize*3),
    heartPosition = new Float32Array(heartSize*3),
    heartColor = new Float32Array(heartSize*3),
    heartScale = new Float32Array(heartSize);
let heartGeometry = new THREE.BufferGeometry()
        .setAttribute("dst", new THREE.BufferAttribute(heartDst, 3))
        .setAttribute("position", new THREE.BufferAttribute(heartPosition, 3))
        .setAttribute("color", new THREE.BufferAttribute(heartColor, 3))
        .setAttribute("scale", new THREE.BufferAttribute(heartScale, 1)),
    heartMaterial = material.clone(),
    heartPoints = new THREE.Points(heartGeometry, heartMaterial);
let newFlag = true, imgI = -1;
let heartingI0 = 0, heartingI1 = 0, heartingJ0 = 0, heartingJ1 = 0, alpha0 = 0, t0;
let endFlag = false, endHandleFlag = false, finishFlag = false, doneFlag = false;
let rotateY = new THREE.Matrix4().makeRotationY(D3_OMEGA);

function updateImgPosition() {
    let i = 0, j = 0;
    UTILS.dataForeach(
        new DataView(new Uint32Array(imgSize*4).buffer),
        D3_IMG_AREA, D3_IMG_RATIO,
        (x, y) => {
            [imgSrc[i], imgSrc[i+1], imgSrc[i+2]] = [x, y, 0];
            imgAlpha[j] = (y - x - D3_IMG_C) / D3_IMG_R;
            i += 3; j++;
        }
    );
    let cr = camera.position.length(),
        ec = camera.position.clone().normalize(),
        eh = new THREE.Vector3(0, 1, 0).cross(ec).normalize();
    new THREE.BufferAttribute(imgSrc, 3).applyMatrix4(
        new THREE.Matrix4().makeBasis(
            eh.clone().multiplyScalar(px),
            eh.clone().cross(ec).multiplyScalar(px),
            ec
        ).setPosition(ec.clone().multiplyScalar(cr - D3_IMG_DISTANCE))
    );
}

async function loadImgs() {
    imgs = await Promise.all(D3_IMGS.map(
        img => IMG.getImgDotsData(img, D3_IMG_GEOMETRY.map(v=>v/D3_IMG_RATIO), IMG_MODE)
    ));
    imgs = imgs.map(([, data]) => {
        let color = new Float32Array(imgSize*3),
            scale = new Float32Array(imgSize);
        let i = 0, j = 0;
        UTILS.dataForeach(
            new DataView(data.buffer), D3_IMG_AREA, D3_IMG_RATIO,
            (x, y, rgbl) => {
                [color[i], color[i+1], color[i+2]] =
                    [(rgbl>>>24)*_255, (rgbl<<8>>>24)*_255, (rgbl<<16>>>24)*_255];
                scale[j] = (rgbl<<24>>>24)*_255;
                i += 3; j++;
            }
        );
        return [color, scale];
    });
}

function initHeart() {
    let theta, thickness, r;
    let dsts = [];
    for (let thetaI = -D3_HEART_THETA; thetaI < D3_HEART_THETA; thetaI++)
    for (let thicknessI = -D3_HEART_THICKNESS; thicknessI < D3_HEART_THICKNESS; thicknessI++) {
        theta = thetaI / D3_HEART_THETA / 2 * Math.PI;
        if (thicknessI < 0) theta = Math.PI - theta;
        thickness = Math.abs(thicknessI) / D3_HEART_THICKNESS * 2 - 1;
        r = 1/(1-Math.abs(Math.cos(theta))*Math.sin(theta))**.5;
        dsts.push([
            thickness,
            (1-thickness**2)**.5 *r*Math.sin(theta),
            (1-thickness**2)**.5 *r*Math.cos(theta)
        ]);
    }
    dsts.sort((a, b) => a[1] - b[1]);
    let i = 0;
    dsts.forEach((dst) => {
        [heartDst[i], heartDst[i+1], heartDst[i+2]] = dst;
        i += 3;
    })
    heartGeometry.attributes.dst.applyMatrix4(
        new THREE.Matrix4().makeScale(...D3_HEART_SCALE)
    );
}

export function d3init() {
    camera.position.set(12, 5, 12);
    camera.lookAt(0, 0, 0);
    camera.updateMatrix();

    loadImgs();
    updateImgPosition();
    initHeart();

    scene.add(imgPoints);
    scene.add(heartPoints);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(anim);
    document.querySelector("#d3-container").append(renderer.domElement);

    clock.start();
}

async function anim() {
    let dt = clock.getDelta();
    let t = clock.getElapsedTime();
    if (!finishFlag && (newFlag || t > D3_CYCLE_TIME)) await newAnim();
    if (endFlag) {
        if (!endHandleFlag) {
            await setImg(heartSize/6 >>>0);
            endHandleFlag = true;
            t0 = t;
        }
        await imgHeart(t);
    }
    if (finishFlag && !doneFlag) heartFinish(t, dt);
    updateHeart(dt);
    heartGeometry.attributes.position.applyMatrix4(rotateY);
    heartGeometry.attributes.dst.applyMatrix4(rotateY);
    heartGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
}

function updateHeart(dt) {
    for (let i = heartingI0; i < heartingI1; i++) {
        heartPosition[i] += (heartDst[i] - heartPosition[i]) * dt * D3_POSITION_EXP;
        heartColor[i] += (D3_HEART_COLOR[i%3] - heartColor[i]) * dt * D3_COLOR_EXP;
    }
    for (let j = heartingJ0; j < heartingJ1; j++) {
        heartScale[j] += (D3_HEART_RATIO - heartScale[j]) * dt * D3_SCALE_EXP;
    }
    heartGeometry.attributes.color.needsUpdate = true;
    heartGeometry.attributes.scale.needsUpdate = true;
}

function setImg(hearting) {
    imgHeartShuffle = imgHeartShuffle.map(()=>0);
    for (let i = 0; i < hearting; i++)
        imgHeartShuffle[Math.random() * imgHeartShuffle.length >>>0]++;
    imgGeometry.attributes.position.copyArray(imgSrc);
    imgGeometry.attributes.color.copyArray(imgs[imgI][0]);
    imgGeometry.attributes.scale.copyArray(imgs[imgI][1]);
    imgGeometry.attributes.position.needsUpdate = true;
    imgGeometry.attributes.color.needsUpdate = true;
    imgGeometry.attributes.scale.needsUpdate = true;
}

async function newAnim() {
    newFlag = false;
    clock.start();
    imgI++; heartingI0 = heartingI1; heartingJ0 = heartingJ1; alpha0 = 0;
    endFlag = endHandleFlag = false;

    if (imgI === D3_IMGS.length) {
        finishFlag = true;
        return;
    }

    let img = document.createElement("div");
    img.style.backgroundImage = `url("images/${D3_IMGS[imgI]}.source.png")`;
    img.style.backgroundPosition = "center";
    img.style.backgroundSize = "cover"
    img.style.position = "fixed";
    [img.style.left, img.style.top, img.style.width, img.style.height] =
        [(WIDTH - D3_IMG_WIDTH) / 2, (HEIGHT - D3_IMG_HEIGHT) / 2, D3_IMG_WIDTH, D3_IMG_HEIGHT].map(v=>v+"px");
    img.style.animation = `slide-in ${D3_IMG_ANIM_S}s both,
        slide-out ${D3_IMG_ANIM_S}s forwards ${D3_IMG_ANIM_SPAN_S}s`;
    document.body.appendChild(img);
    UTILS.onanimationend(img).then(() => endFlag = true);
}

function heartFinish(t, dt) {
    let heartingI1old = heartingI1, heartingJ1old = heartingJ1;
    if (heartingJ1 < heartSize) {
        heartingJ1 += ((heartSize - heartingJ1old) * dt * D3_FINISH_EXP >>>0) + 1;
        heartingI1 += ((heartSize - heartingJ1old) * dt * D3_FINISH_EXP >>>0)*3 + 3;
    }
    if (t < D3_FINISHING_TIME) {
        let alpha = t / D3_FINISHING_TIME;
        alpha = UTILS.easeInOut(alpha);
        rotateY = new THREE.Matrix4().makeRotationY(
            D3_OMEGA + (D3_FINISHING_OMEGA - D3_OMEGA) * alpha
        );
    } else if (t > D3_FINISHING_TIME + D3_FINISH_TIME) {
        let alpha = (t - D3_FINISHING_TIME - D3_FINISH_TIME) / D3_FINISHED_TIME;
        if (alpha < 1) {
            alpha = UTILS.easeInOut(alpha);
            rotateY = new THREE.Matrix4().makeRotationY(
                D3_FINISHING_OMEGA + (D3_FINISHED_OMEGA - D3_FINISHING_OMEGA) * alpha
            );
        } else {
            rotateY = new THREE.Matrix4();
            doneFlag = true;
            t0 = t;
        }
    }
    let phi = 0;
    for (let i = heartingI1old, j = heartingJ1old; j < heartingJ1; i+=3, j++) {
        phi = Math.atan2(heartDst[i+2], heartDst[i]) + (t - t0) * D3_FINISH_ROTATE;
        [heartPosition[i], heartPosition[i+1], heartPosition[i+2]] = [
            Math.cos(phi) * D3_HEART_FROM_RADIUS,
            heartDst[i+1],
            Math.sin(phi) * D3_HEART_FROM_RADIUS,
        ];
        [heartColor[i], heartColor[i+1], heartColor[i+2]] = D3_HEART_COLOR;
        heartScale[j] = D3_HEART_RATIO;
    }
}

function addImgToHeart(i, j) {
    [heartPosition[heartingI1], heartPosition[heartingI1+1], heartPosition[heartingI1+2]] =
        [imgPosition[i], imgPosition[i+1], imgPosition[i+2]];
    [heartColor[heartingI1], heartColor[heartingI1+1], heartColor[heartingI1+2]] =
        [imgColor[i], imgColor[i+1], imgColor[i+2]];
    heartScale[heartingJ1] = imgScale[j];
    heartingI1 += 3; heartingJ1++;
}

async function imgHeart(t) {
    let alpha = (t - t0 - D3_CSS_SPAN) / D3_IMG_HEART_TIME;
    if (alpha < 0) return;
    alpha = UTILS.easeInOut(alpha);

    if (alpha0 < 1) {
        let i = 0;
        imgAlpha.forEach((a, j) => {
            if (a > alpha || a < alpha0) return i += 3;
            for (let k = 0; k < imgHeartShuffle[j]; k++) {
                addImgToHeart(i, j);
            }
            [imgPosition[i], imgPosition[i + 1], imgPosition[i + 2]] = [0, 0, 0];
            [imgColor[i], imgColor[i + 1], imgColor[i + 2]] = [0, 0, 0];
            imgScale[j] = 0;
            i += 3;
        });
    }
    imgGeometry.attributes.position.needsUpdate = true;
    imgGeometry.attributes.color.needsUpdate = true;
    imgGeometry.attributes.scale.needsUpdate = true;

    alpha0 = alpha;
}