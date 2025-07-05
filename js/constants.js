// essential constants
// not recommended for change
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const _255 = 1/255;
const TAU = Math.PI*2;
const CONTAIN = 0;
const COVER = 1;
const FILL = 2;

// canvas
// not recommended for change
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d", {desynchronized: true});
let tcan = document.createElement("canvas");
// document.body.appendChild(tcan);
let tctx = tcan.getContext("2d", {willReadFrequently: true});
let lcan = document.getElementById("lyrics");
let lctx = lcan.getContext("2d", {desynchronized: true});
tctx.globalCompositeOperation = "copy"
canvas.width = tcan.width = WIDTH;
canvas.height = tcan.height = HEIGHT;
lcan.width = WIDTH;
lcan.height = HEIGHT/10;

/** Lyrics file should be in the format of LRC.
 * @type {string}
 */
const LYRICS_URL = "./assets/lyrics.lrc";
const LYRICS_FONT = "16px my-lyric";

/**
 * Specify the images on the opening page.
 *
 * Naming conventions for images:
 * - `<filename>.color.png`: Contains only the `A` and `B` channels of the `CIELAB` color
 * space, with the L channel fixed at a constant value of 50. (This represents the color
 * information without luminance variation.)
 * - `<filename>.grayscale.png`: Contains only the `L` channel (representing the image's
 * grayscale information).
 * - `<filename>.source.png`: Contains the original image.
 *
 * All the images should be under the [`images`](../images) folder.
 *
 * Provided script [`separation.py`](../separation.py) can be used to generate these files
 * from source images automatically. By default, this script applies gamma correction to the
 * original image.
 *
 * @type {string[]}
 */
const IMGS = ["a", "b", "c", "d"];
const IMG_WIDTH_ = .8*WIDTH, IMG_HEIGHT_ = .8*HEIGHT;
/** Radii of dots of images on the opening page.
 * @type {number}
 */
const IMG_RATIO = 5;
const IMG_FPS = 24;
/** The duration of fading animations between two images.
 * @type {number}
 */
const IMG_FADE_S = 1;
/** The duration of showing an image.
 * @type {number}
 */
const IMG_SPAN_MS = 6000;
/** The duration of the coloring animation after clicking.
 * @type {number}
 */
const IMG_COLOR_MS = 4000;
/** The timespan between the coloring animation of dots and the sliding animation of the
 * original image.
 * @type {number}
 */
const IMG_COLOR_SPAN_S = .5;
/** Params of the CSS sliding animation of the original image.
 * @type {number}
 */
const IMG_ANIM_S = 2, IMG_ANIM_DELAY_S = 4;
/** Image Displaying mode
 * @type {number}
 */
const IMG_MODE = COVER;

// generated constants
// not recommended for change
const IMG_WIDTH = IMG_WIDTH_-IMG_WIDTH_%IMG_RATIO,
    IMG_HEIGHT = IMG_HEIGHT_-IMG_HEIGHT_%IMG_RATIO;
const IMG_X0 = (WIDTH-IMG_WIDTH)/2, IMG_X1 = (WIDTH+IMG_WIDTH)/2,
    IMG_Y0 = (HEIGHT-IMG_HEIGHT)/2, IMG_Y1 = (HEIGHT+IMG_HEIGHT)/2,
    IMG_C0 = IMG_Y0 - IMG_X1, IMG_C1 = IMG_Y1 - IMG_X0;
const IMG_AREA = [IMG_X0, IMG_X1, IMG_Y0, IMG_Y1];
const IMG_GEOMETRY = [WIDTH, HEIGHT, ...IMG_AREA];

/** Radii of dots of texts.
 * @type {number}
 */
const TEXT_RATIO = 10;
/**
 * Velocity of particles of texts.
 *
 * Over time `dt` (ms), each particle moves toward its target, reducing the distance to it by a
 * factor of `exp*dt`.
 *
 * @type {number}
 */
const TEXT_EXP = 4e-3;
/**
 * Tells where the particles are allowed to be generated before showing the first sentence
 * defined in `TEXTS`.
 *
 * Should be in the format of [x0, y0, x1, y1].
 *
 * @type {number[]}
 */
const TEXT_AREA = IMG_AREA;
const TEXT_BACKGROUND = "#da6c6c";
const TEXT_BACKGROUND_LIGHT = "#da6c6c20", TEXT_BACKGROUND_DARK = "#da6c6c80";
const TEXT_FOREGROUND = "white";
/**
 * Texts to shown.
 *
 * Should be in the format of `[text to shown, font styles, duration]`
 *
 * @type {(string|number)[][]}
 */
const TEXTS = [
    ["XXX", "28px my-sans-serif", 3000],
];

/** Similar to `TEXT_EXP`
 * @type {number}
 */
const TRANSITION_EXP = 1e-3;
const TRANSITION_BACKGROUND = "#cd5656";
const TRANSITION_BACKGROUND_LIGHT = "#cd565620", TRANSITION_BACKGROUND_DARK = "#cd565680";
const TRANSITION_FOREGROUND = "#d1d65c";
const TRANSITION_TEXT = ["Happy Birthday!", "22px my-sans-serif bold"];
const TRANSITION_DELAY = 1500, TRANSITION_SPAN = 12000;
// const TRANSITION_DELAY = 0, TRANSITION_SPAN = 0;

/** Radius of firework particles.
 * @type {number}
 */
const FIREWORK_RATIO = 8;
/** The ratio of the particle radii before and after explosion.
 * @type {number}
 */
const FIREWORK_R_RATIO = .8;
const FIREWORK_BACKGROUND = "#cd5656";
const FIREWORK_BACKGROUND_LIGHT = "#af3e3e20", FIREWORK_BACKGROUND_DARK = "#af3e3e80";
/** Similar to `TEXT_EXP`. However, this refers to the transparency of particles.
 * @type {number}
 */
const FIREWORK_EXP = 4e-3;
/**
 * Gravity of firework particles.
 *
 * Over time `dt` (ms), the vertical velocity of each particle changes by `gravity*dt`.
 *
 * @type {number}
 */
const FIREWORK_GRAVITY = 5e-4;
const FIREWORK_MAX_AGE_MS = 2000;
/** Initial velocity of particles after explosion.
 * @type {number}
 */
const FIREWORK_VP0 = 4e-1;
/** Initial velocity interval of particles from the bottom of screen.
 * @type {number[]}
 */
const FIREWORK_VF = [4e-1, 8e-1];
/** The amount interval of particles to generate after explosion.
 * @type {number[]}
 */
const FIREWORK_DIVISION = [50, 100];
/** The x-coordinate of particles from the bottom of screen.
 * @type {number[]}
 */
const FIREWORK_X = [WIDTH/10, WIDTH*9/10];
/** The transparency interval of firework particles.
 * @type {number[]}
 */
const FIREWORK_ALPHA = [1, 1];
/** The timespan between two fireworks in a round.
 * @type {number}
 */
const FIREWORK_TIMESPAN = 200;
/** The timespan between two rounds of fireworks.
 * @type {number}
 */
const FIREWORK_DELAY = 3000;
/** The amount of fireworks in a round.
 * @type {number[]}
 */
const FIREWORK_GENERATION = [3, 8];
/**
 * The proportion of single-color, dual-color, ..., and n-color fireworks.
 *
 * Should be in the format of [amount of color, cumulative probability]. The last item
 * should only contain the amount of color, as the default.
 *
 * @type {(number[]|number)[]}
 */
const FIREWORK_COLOR = [
    [1, .8],
    [2, .9],
    3
];
/** The HTML texts shown during the firework.
 * @type {string[]}
 */
const FIREWORK_TEXT = [
    "Here some text...",
    "HTML escape&nbsp;code is supported",
    "<small>HTML tags are also supported</small>"
];
/** Delayed time after starting fireworks.
 * @type {number}
 */
const FIREWORK_HAPPY_DELAY = 4000;
/** Delayed time between two lines of `FIREWORK_TEXT`.
 * @type {number}
 */
const FIREWORK_HAPPY_SPAN = 400;

/** Radius of particles of lyrics.
 * @type {number}
 */
const LYRICS_RATIO = 4;
/** Similar to `TEXT_EXP`.
 * @type {number}
 */
const LYRICS_EXP = 6e-3;
/** Similar to `TEXT_AREA`.
 * @type {(number|number)[]}
 */
const LYRICS_AREA = [0, WIDTH, 0, HEIGHT/8];
const LYRICS_FOREGROUND = "white";

/** Images to shown in the 3D scene. Similar to `IMGS`.
 * @type {string[]}
 */
const D3_IMGS = ["a", "b", "c", "d"];
/** Radius of particles of images.
 * @type {number}
 */
const D3_IMG_RATIO = 6;
/** The distance between the camera and images.
 * @type {number}
 */
const D3_IMG_DISTANCE = 2;
const D3_IMG_FOV = 45, D3_IMG_WIDTH_ = .6*WIDTH, D3_IMG_HEIGHT_ = .6*HEIGHT;

/** Tells the steps of variables of the heart function.
 * @type {number}
 */
const D3_HEART_THETA = 60, D3_HEART_THICKNESS = 60;
/** Radius of particles of the heart.
 * @type {number}
 */
const D3_HEART_RATIO = 6;
const D3_HEART_COLOR = [1., .75, .75], D3_HEART_SCALE = [2, 3, 2.7];
/** The angular velocity of the heart.
 * @type {number}
 */
const D3_OMEGA = .05, D3_FINISHING_OMEGA = .2, D3_FINISHED_OMEGA = 0.;

/** The duration of each animation of images.
 * @type {number}
 */
const D3_CYCLE_TIME = 14;
/** The timespan between the CSS sliding animation and the particleization animation.
 * @type {number}
 */
const D3_CSS_SPAN = 3;
/** The timespan between the particleization animation and the animation to form the heart.
 * @type {number}
 */
const D3_IMG_HEART_TIME = 4;
/** Similar to `TEXT_EXP` and `FIREWORK_EXP`.
 * @type {number}
 */
const D3_POSITION_EXP = 1.5, D3_COLOR_EXP = 1.5, D3_SCALE_EXP = 1.5,
    D3_FINISH_EXP = .2;
/** Tells where the particles are from during the final formation of the heart.
 * @type {number}
 */
const D3_HEART_FROM_RADIUS = 40, D3_FINISH_ROTATE = .46;
/** Tells when to change the angular velocity of the heart during the final formation of the heart.
 * @type {number}
 */
const D3_FINISHING_TIME = 8, D3_FINISH_TIME = 2, D3_FINISHED_TIME = 16,
    D3_REMAIN_TIME = 8;

// generated constants
// not recommended for change
const D3_IMG_WIDTH = D3_IMG_WIDTH_-D3_IMG_WIDTH_%D3_IMG_RATIO,
    D3_IMG_HEIGHT = D3_IMG_HEIGHT_-D3_IMG_HEIGHT_%D3_IMG_RATIO;
const D3_IMG_X0 = -D3_IMG_WIDTH/2, D3_IMG_X1 = D3_IMG_WIDTH/2,
    D3_IMG_Y0 = -D3_IMG_HEIGHT/2, D3_IMG_Y1 = D3_IMG_HEIGHT/2,
    D3_IMG_C = D3_IMG_Y0 - D3_IMG_X1, D3_IMG_R = D3_IMG_Y1 - D3_IMG_X0 - D3_IMG_C;
const D3_IMG_AREA = [D3_IMG_X0, D3_IMG_X1, D3_IMG_Y0, D3_IMG_Y1];
const D3_IMG_GEOMETRY = [D3_IMG_WIDTH, D3_IMG_HEIGHT, 0, D3_IMG_WIDTH, 0, D3_IMG_HEIGHT];
const D3_IMG_ANIM_S = 2, D3_IMG_ANIM_SPAN_S = 4;
