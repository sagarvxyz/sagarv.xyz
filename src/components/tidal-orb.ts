import { LitElement, css, html, svg } from "lit";

/**
 * <tidal-orb>: a slightly imperfect liquid circle. The pointer acts as a moon
 * pulling on a fixed amount of liquid. A soft bump gathers on the side facing
 * the pointer, the rest of the orb draws in evenly to feed it, and the whole orb
 * leans a little toward the pointer. Each surface point is a damped spring that
 * reaches out more slowly than it settles back, and the bump's direction and
 * width wander slightly, so the pull reads as liquid rather than mechanical.
 *
 * @attr reach - pointer distance, in orb radii, where the pull reaches full strength (default 2)
 */

const N = 36; // surface points
const C = 100; // centre, in SVG units
const R = 64; // base radius
const STIFFNESS = 38; // pull back toward the target shape
const REACHING = 0.55; // stiffness multiplier while a point moves outward: liquid reaches slowly
const DAMPING = 4.5; // low = more jiggle
const TENSION = 55; // neighbours drag each other along, like surface tension
const PULL = 0.26 * R; // height of the bump toward the pointer, at full strength
const FOCUS = 2.5; // how tightly the bump gathers around the pointer's direction
const LEAN = 0.05 * R; // how far the whole orb drifts toward the pointer
const CLOSE = 1.25; // extra stretch when the pointer is closer than `reach`
const STEP = 1 / 120;

// Fixed, smooth irregularity: the wabi-sabi shape. Low harmonics only, so it
// reads as hand-drawn rather than noisy.
const ANGLES = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2);
const IMPERFECTION = ANGLES.map(
    (a) =>
        0.01 * Math.sin(2 * a + 0.7) +
        0.006 * Math.sin(3 * a + 2.1) +
        0.003 * Math.sin(5 * a + 4.2),
);

function pathFor(radii: ArrayLike<number>, dx = 0, dy = 0): string {
    const pts = ANGLES.map((a, i) => [
        C + dx + radii[i] * Math.cos(a),
        C + dy + radii[i] * Math.sin(a),
    ]);
    const p = (i: number) => pts[(i + N) % N];
    let d = `M${p(0)[0].toFixed(2)},${p(0)[1].toFixed(2)}`;
    // Closed Catmull-Rom spline through every point, written as cubic Béziers.
    for (let i = 0; i < N; i++) {
        const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += `C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
    }
    return d + "Z";
}

const RESTING = ANGLES.map((_, i) => R * (1 + IMPERFECTION[i]));

export class TidalOrb extends LitElement {
    static properties = { reach: { type: Number } };
    declare reach: number;

    constructor() {
        super();
        this.reach = 2;
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            aspect-ratio: 1;
            pointer-events: none;
        }

        svg {
            display: block;
            width: 100%;
            height: 100%;
            overflow: visible;
        }

        /* Offset the SVG layer, not a filter surface, in screen pixels. */
        .shadow {
            position: absolute;
            inset: 0;
            translate: var(--orb-shadow-x, -4px) var(--orb-shadow-y, 3px);
            fill: var(--color-text, #111);
            stroke: var(--color-text, #111);
        }

        .shadow path {
            stroke-width: 1.25px;
            vector-effect: non-scaling-stroke;
        }

        .surface {
            position: relative;
        }

        .body {
            fill: var(--color-accent, oklch(90% 0.2 99deg));
            stroke: var(--color-text, #111);
            stroke-width: 1.25px;
            vector-effect: non-scaling-stroke;
        }
    `;

    #offset = new Float64Array(N); // radial displacement from the resting shape
    #velocity = new Float64Array(N);
    #radii = new Float64Array(RESTING);
    #pointer: { x: number; y: number } | null = null; // in SVG units
    #moon = { x: C, y: C, strength: 0 }; // eased toward the pointer
    #lean = { x: 0, y: 0, vx: 0, vy: 0 }; // whole-orb drift toward the pointer
    #bump = new Float64Array(N);
    #raf = 0;
    #last = 0;
    #carry = 0;
    #time = Math.random() * 100;
    #visible = false;
    #observer?: IntersectionObserver;
    #body?: SVGPathElement;
    #shadow?: SVGPathElement;

    render() {
        // The element box is the resting circle; stretching overflows it.
        const path = pathFor(RESTING);
        return html`
            <svg class="shadow" viewBox="${C - R} ${C - R} ${2 * R} ${2 * R}" aria-hidden="true">
                ${svg`<path d=${path}></path>`}
            </svg>
            <svg class="surface" viewBox="${C - R} ${C - R} ${2 * R} ${2 * R}" aria-hidden="true">
                ${svg`<path class="body" d=${path}></path>`}
            </svg>
        `;
    }

    firstUpdated() {
        this.#body = this.renderRoot.querySelector(".body")!;
        this.#shadow = this.renderRoot.querySelector(".shadow path")!;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        window.addEventListener("pointermove", this.#onPointer, { passive: true });
        document.addEventListener("pointerleave", this.#onLeave);
        document.addEventListener("visibilitychange", this.#sync);
        this.#observer = new IntersectionObserver(([entry]) => {
            this.#visible = entry.isIntersecting;
            this.#sync();
        });
        this.#observer.observe(this);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener("pointermove", this.#onPointer);
        document.removeEventListener("pointerleave", this.#onLeave);
        document.removeEventListener("visibilitychange", this.#sync);
        this.#observer?.disconnect();
        cancelAnimationFrame(this.#raf);
        this.#raf = 0;
    }

    #onPointer = (e: PointerEvent) => {
        const box = this.getBoundingClientRect();
        this.#pointer = {
            x: C - R + ((e.clientX - box.left) / box.width) * 2 * R,
            y: C - R + ((e.clientY - box.top) / box.height) * 2 * R,
        };
    };

    #onLeave = () => {
        this.#pointer = null;
    };

    // Animate only while on screen and the tab is visible.
    #sync = () => {
        const run = this.#visible && !document.hidden;
        if (run && !this.#raf) {
            this.#last = performance.now();
            this.#raf = requestAnimationFrame(this.#frame);
        } else if (!run && this.#raf) {
            cancelAnimationFrame(this.#raf);
            this.#raf = 0;
        }
    };

    #frame = (now: number) => {
        this.#carry += Math.min((now - this.#last) / 1000, 0.05);
        this.#last = now;
        while (this.#carry >= STEP) {
            this.#step(STEP);
            this.#carry -= STEP;
        }
        const path = pathFor(this.#radii, this.#lean.x, this.#lean.y);
        this.#body!.setAttribute("d", path);
        this.#shadow!.setAttribute("d", path);
        this.#raf = requestAnimationFrame(this.#frame);
    };

    #step(dt: number) {
        this.#time += dt;
        const moon = this.#moon;

        // The moon drifts toward the pointer rather than snapping to it.
        let target = 0;
        if (this.#pointer) {
            const ease = 1 - Math.exp(-dt * 6);
            moon.x += (this.#pointer.x - moon.x) * ease;
            moon.y += (this.#pointer.y - moon.y) * ease;
            const dist = Math.hypot(moon.x - C, moon.y - C);
            target = Math.min(CLOSE, ((this.reach * R) / Math.max(dist, 1)) ** 2);
        }
        moon.strength += (target - moon.strength) * (1 - Math.exp(-dt * 3));
        const strength = moon.strength;
        const t = this.#time;
        // The bump's direction and width wander slowly, so the pull never looks mechanical.
        const phi =
            Math.atan2(moon.y - C, moon.x - C) + 0.1 * Math.sin(t * 0.7) + 0.05 * Math.sin(t * 1.9);
        const focus = FOCUS + 0.5 * Math.sin(t * 0.5);

        // A soft bump (von Mises) toward the pointer. Subtracting its mean makes
        // the rest of the orb draw in evenly: the liquid is moved, not added.
        const bump = this.#bump;
        let mean = 0;
        for (let i = 0; i < N; i++) {
            bump[i] = Math.exp(focus * (Math.cos(ANGLES[i] - phi) - 1));
            mean += bump[i] / N;
        }

        const offset = this.#offset;
        const velocity = this.#velocity;
        for (let i = 0; i < N; i++) {
            const a = ANGLES[i];
            const tide = strength * PULL * (bump[i] - mean);
            // A slow, low-amplitude breath so it stays alive with no pointer.
            const idle =
                R * (0.006 * Math.sin(t * 0.9 + 2 * a) + 0.004 * Math.sin(t * 1.7 - 3 * a));
            const goal = tide + idle;
            const stiffness = goal > offset[i] ? STIFFNESS * REACHING : STIFFNESS;
            const neighbours = offset[(i + N - 1) % N] + offset[(i + 1) % N] - 2 * offset[i];
            const accel =
                stiffness * (goal - offset[i]) + TENSION * neighbours - DAMPING * velocity[i];
            velocity[i] += accel * dt;
        }

        // The whole orb leans toward the pointer on a softer spring.
        const lean = this.#lean;
        lean.vx += (20 * (LEAN * strength * Math.cos(phi) - lean.x) - 5 * lean.vx) * dt;
        lean.vy += (20 * (LEAN * strength * Math.sin(phi) - lean.y) - 5 * lean.vy) * dt;
        lean.x += lean.vx * dt;
        lean.y += lean.vy * dt;

        for (let i = 0; i < N; i++) {
            offset[i] += velocity[i] * dt;
            this.#radii[i] = RESTING[i] + offset[i];
        }
    }
}

customElements.define("tidal-orb", TidalOrb);
