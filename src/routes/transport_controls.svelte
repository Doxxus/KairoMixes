<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    import type { Mix } from '../objects/mix';
    import { global_volume } from '../objects/stores';

    export let mix: Mix;
    export let audio: HTMLAudioElement | undefined = undefined;

    const dispatch = createEventDispatcher<{ toggle: void, seek: void }>();

    let current_time = 0;
    let duration = 0;
    let muted = false;
    let seek_pulse = { dir: 1, n: 0 };

    $: if (audio) audio.volume = $global_volume;
    $: seek_fill = duration ? (current_time / duration) * 100 : 0;

    function SyncTime() {
        if (!audio) return;
        current_time = audio.currentTime;
        duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    }

    function SeekTo(seconds: number) {
        if (!audio) return;
        audio.currentTime = seconds;
        SyncTime();
        dispatch('seek');
    }

    function SeekBy(delta: number) {
        if (!audio) return;
        seek_pulse = { dir: delta < 0 ? -1 : 1, n: seek_pulse.n + 1 };
        SeekTo(Math.min(Math.max(audio.currentTime + delta, 0), duration || Infinity));
    }

    function ToggleMute() {
        if (audio) audio.muted = !audio.muted;
    }

    function FormatTime(seconds: number): string {
        const whole = Math.floor(seconds);
        const secs = whole % 60;
        return `${Math.floor(whole / 60)}:${secs < 10 ? '0' : ''}${secs}`;
    }
</script>

<audio id={mix.id.toString()} src={mix.audio_file_path} preload="metadata" bind:this={audio}
    on:play on:pause on:ended
    on:timeupdate={SyncTime} on:loadedmetadata={SyncTime} on:durationchange={SyncTime}
    on:volumechange={() => muted = audio?.muted ?? false}>
</audio>

<!-- The card is itself a button, so clicks/keys here must not bubble up and toggle playback -->
<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div class="custom_player" role="group" aria-label="{mix.name} player controls" on:click|stopPropagation on:keydown|stopPropagation>
    <button type="button" class="ctl_btn" aria-label="Back 10 seconds" on:click={() => SeekBy(-10)}>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <g transform="translate(24 0) scale(-1 1)">
                {#key seek_pulse.n}
                    <g class="seek_arc" class:spin={seek_pulse.n > 0 && seek_pulse.dir === -1}>
                        <path d="M12 4.5a7.5 7.5 0 1 1-7.5 7.5M12 1.5l3.5 3-3.5 3" />
                    </g>
                {/key}
            </g>
            <text x="12" y="15" text-anchor="middle" class="seek_num">10</text>
        </svg>
    </button>
    <button type="button" class="ctl_btn play_btn" aria-label={mix.playing ? 'Pause' : 'Play'} on:click={() => dispatch('toggle')}>
        <svg class="icon play_icon" class:is_playing={mix.playing} viewBox="0 0 24 24" aria-hidden="true">
            <path class="half left" d="M6 4L12 7.5L12 16.5L6 20Z" />
            <path class="half right" d="M12 7.5L19 12L19 12L12 16.5Z" />
        </svg>
    </button>
    <button type="button" class="ctl_btn" aria-label="Forward 10 seconds" on:click={() => SeekBy(10)}>
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            {#key seek_pulse.n}
                <g class="seek_arc" class:spin={seek_pulse.n > 0 && seek_pulse.dir === 1}>
                    <path d="M12 4.5a7.5 7.5 0 1 1-7.5 7.5M12 1.5l3.5 3-3.5 3" />
                </g>
            {/key}
            <text x="12" y="15" text-anchor="middle" class="seek_num">10</text>
        </svg>
    </button>
    <span class="time_label">{FormatTime(current_time)}</span>
    <input type="range" class="seek_bar" aria-label="Seek" min="0" max={duration} step="0.1"
        value={current_time} disabled={!duration} style="--seek-fill:{seek_fill}%"
        on:input={(e) => SeekTo(e.currentTarget.valueAsNumber)}>
    <span class="time_label total">{FormatTime(duration)}</span>
    <button type="button" class="ctl_btn" aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} on:click={ToggleMute}>
        <svg class="icon mute_icon" class:is_muted={muted} viewBox="0 0 24 24" aria-hidden="true">
            <path class="speaker" d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
            <path class="wave w1" d="M15 9.5a3.5 3.5 0 0 1 0 5" />
            <path class="wave w2" d="M17.5 7a7 7 0 0 1 0 10" />
            <path class="slash" d="M15 9.5l5.5 5M20.5 9.5l-5.5 5" />
        </svg>
    </button>
</div>

<style lang="scss">
    .custom_player {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--mix-ink, #fff);
        font: 600 0.8rem/1 Arial, Helvetica, sans-serif;
        text-shadow: none;
        cursor: default;
    }

    .ctl_btn {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.2rem;
        height: 2.2rem;
        padding: 0 0.4rem;
        border: 1px solid var(--mix-edge, rgba(255, 255, 255, 0.3));
        border-radius: 0.5rem;
        color: inherit;
        background: var(--mix-glass-strong, rgba(15, 4, 26, 0.7));
        font: inherit;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;

        &:hover { background: var(--mix-halo, rgba(218, 213, 234, 0.38)); }
        &:active { transform: scale(0.9); }
    }

    .play_btn {
        min-width: 2.6rem;
        height: 2.6rem;
        border-radius: 50%;
    }

    .icon {
        width: 1.3rem;
        height: 1.3rem;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
        overflow: visible;
    }

    .seek_num {
        fill: currentColor;
        stroke: none;
        font: 700 7px Arial, Helvetica, sans-serif;
    }

    // Play <-> pause: the triangle splits into two bars (path morph; browsers without `d` transitions just swap)
    .play_icon {
        transition: transform 0.2s;

        .half {
            fill: currentColor;
            stroke-width: 1;
            transition: d 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .left { d: path('M6 4L12 7.5L12 16.5L6 20Z'); }
        .right { d: path('M12 7.5L19 12L19 12L12 16.5Z'); }
        &.is_playing .left { d: path('M6 4L10 4L10 20L6 20Z'); }
        &.is_playing .right { d: path('M14 4L18 4L18 20L14 20Z'); }
    }

    .play_btn:hover .play_icon { transform: scale(1.15); }

    // Seek: the circular arrow whips around once per click. In the mirrored (back) icon the same
    // clockwise rotation reads as counter-clockwise.
    @keyframes seek_spin {
        from { transform: rotate(0); }
        to { transform: rotate(360deg); }
    }

    .seek_arc {
        transform-box: view-box;
        transform-origin: 12px 12px;

        &.spin { animation: seek_spin 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
    }

    // Mute: waves fade out and an X draws in
    .mute_icon {
        .speaker { fill: currentColor; stroke-width: 1.2; }

        .wave {
            transition: opacity 0.25s, transform 0.25s;
            transform-origin: 12px 12px;
        }

        .slash {
            stroke-dasharray: 16;
            stroke-dashoffset: 16;
            transition: stroke-dashoffset 0.3s ease 0.05s;
        }

        &.is_muted {
            .w1 { opacity: 0; transform: translateX(-3px); }
            .w2 { opacity: 0; transform: translateX(-5px); }
            .slash { stroke-dashoffset: 0; }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .play_icon, .play_icon .half, .mute_icon .wave, .mute_icon .slash { transition: none; }
        .seek_arc.spin { animation: none; }
    }

    .time_label {
        flex: 0 0 auto;
        min-width: 2.4rem;
        text-align: center;
        font-variant-numeric: tabular-nums;
    }

    .seek_bar {
        flex: 1 1 auto;
        min-width: 40px;
        height: 0.9rem;
        margin: 0;
        appearance: none;
        background: transparent;
        cursor: pointer;

        &:disabled {
            cursor: default;
            opacity: 0.5;
        }

        &::-webkit-slider-runnable-track {
            height: 0.35rem;
            border-radius: 0.2rem;
            background: linear-gradient(to right, var(--mix-ring-a, #DAD5EA) var(--seek-fill, 0%), var(--mix-halo-soft, rgba(218, 213, 234, 0.3)) var(--seek-fill, 0%));
        }

        &::-webkit-slider-thumb {
            appearance: none;
            width: 0.9rem;
            height: 0.9rem;
            margin-top: -0.275rem;
            border-radius: 50%;
            border: 1px solid var(--mix-edge, rgba(255, 255, 255, 0.5));
            background: var(--mix-ink, #fff);
        }

        &::-moz-range-track {
            height: 0.35rem;
            border-radius: 0.2rem;
            background: var(--mix-halo-soft, rgba(218, 213, 234, 0.3));
        }

        &::-moz-range-progress {
            height: 0.35rem;
            border-radius: 0.2rem;
            background: var(--mix-ring-a, #DAD5EA);
        }

        &::-moz-range-thumb {
            width: 0.9rem;
            height: 0.9rem;
            border-radius: 50%;
            border: 1px solid var(--mix-edge, rgba(255, 255, 255, 0.5));
            background: var(--mix-ink, #fff);
        }
    }

    :focus-visible {
        outline: 2px solid #fff;
        outline-offset: 2px;
    }

    @media (max-width: 600px) {
        .total { display: none; }
    }
</style>
