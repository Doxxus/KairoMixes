<script lang="ts">
    import { onMount } from 'svelte';

    export let analyser: AnalyserNode | null = null;
    export let playing = false;
    // Changing this repaints (e.g. after a theme or palette change) even if nothing is playing
    export let redraw_key = '';

    const BARS = 36;

    let canvas: HTMLCanvasElement;
    const levels = new Float32Array(BARS);
    const baselines = new Float32Array(BARS);
    let restart: () => void = () => {};

    // Averages the FFT bins behind one bar. Bars are spaced on a curve so the bass doesn't take up the whole width.
    function Sample(data: Uint8Array, bar: number) {
        // MP3s are low-passed around 16 kHz, so bins above that would just be dead bars
        const usable = Math.min(data.length, 90);
        const edge = (i: number) => Math.floor(1 + (usable - 2) * Math.pow(i / BARS, 2));
        const lo = edge(bar);
        const hi = Math.max(lo + 1, edge(bar + 1));
        let sum = 0;
        for (let k = lo; k < hi; k++) sum += data[k] ?? 0;
        const avg = sum / (hi - lo) / 255;
        // Highs carry less energy, so lift them a little
        return Math.min(1, avg * (1 + (0.6 * bar) / BARS));
    }

    // Loud, compressed masters sit near full scale in every band; measuring each bar against its own
    // recent average keeps transients visible.
    function Shape(raw: number, baseline: number) {
        const floor = baseline * 0.95;
        const contrast = Math.max(0, (raw - floor) / Math.max(0.15, 1 - floor));
        return Math.pow(Math.min(1, 0.15 * raw * raw + 1.2 * contrast), 1.6);
    }

    // Stand-in used when the audio host doesn't allow CORS (a real analyser would read silence).
    function Simulate(now: number, bar: number) {
        return (
            0.2 +
            0.25 * (0.5 + 0.5 * Math.sin(now / 260 + bar * 0.55)) +
            0.2 * (0.5 + 0.5 * Math.sin(now / 410 + bar * 1.3))
        );
    }

    // Re-run the animation whenever its inputs change
    $: analyser, playing, redraw_key, restart();

    onMount(() => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let raf = 0;
        let settle_until = 0;

        function Paint() {
            const dpr = window.devicePixelRatio || 1;
            const width = Math.round(canvas.clientWidth * dpr);
            const height = Math.round(canvas.clientHeight * dpr);
            if (!width || !height) return;
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            const style = getComputedStyle(canvas);
            const gradient = ctx!.createLinearGradient(0, height, 0, 0);
            gradient.addColorStop(0, style.getPropertyValue('--tl-bg2').trim() || '#9F97C2');
            gradient.addColorStop(1, style.getPropertyValue('--mix-ring-a').trim() || '#DAD5EA');

            const bar_width = width / BARS;
            ctx!.clearRect(0, 0, width, height);
            ctx!.globalAlpha = 0.5;
            ctx!.fillStyle = gradient;
            ctx!.beginPath();
            for (let i = 0; i < BARS; i++) {
                // No stub when idle: bars only exist once they have some height
                const bar_height = levels[i] * height;
                if (bar_height < 1) continue;
                const x = i * bar_width;
                const h = Math.max(bar_height, 2 * dpr);
                if ('roundRect' in ctx!) ctx!.roundRect(x, height - h, bar_width, h, Math.min(bar_width / 2, 2 * dpr));
                else ctx!.rect(x, height - h, bar_width, h);
            }
            ctx!.fill();
            ctx!.globalAlpha = 1;
        }

        function Step(now: number) {
            const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
            if (playing && analyser && data) analyser.getByteFrequencyData(data);

            let moving = false;
            for (let i = 0; i < BARS; i++) {
                let target = 0;
                if (playing && data) {
                    const raw = Sample(data, i);
                    const baseline = baselines[i] || raw;
                    // Slow average (about a second and a half) that the bar is measured against
                    baselines[i] = baseline + (raw - baseline) * 0.02;
                    target = Shape(raw, baseline);
                } else if (playing) {
                    target = Simulate(now, i);
                }
                // Rise fast, fall slowly
                levels[i] += (target - levels[i]) * (target > levels[i] ? 0.55 : 0.1);
                if (levels[i] > 0.01) moving = true;
            }

            Paint();
            raf = playing || moving || now < settle_until ? requestAnimationFrame(Step) : 0;
        }

        restart = () => {
            cancelAnimationFrame(raf);
            // Palette colours transition for a while, so keep repainting through it
            settle_until = performance.now() + 1200;
            raf = requestAnimationFrame(Step);
        };
        restart();

        // Resizing clears the canvas, so repaint when the layout changes
        const observer = new ResizeObserver(Paint);
        observer.observe(canvas);

        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
            restart = () => {};
        };
    });
</script>

<canvas bind:this={canvas} class="visualizer" aria-hidden="true"></canvas>

<style lang="scss">
    .visualizer {
        position: absolute;
        left: 0;
        bottom: 100%;
        width: 100%;
        height: 3.2rem;
        pointer-events: none;
    }
</style>
