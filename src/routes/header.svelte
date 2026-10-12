<script lang="ts">
    import '../sass/header.scss';
    import { repeat_mix, global_volume, is_playing, transport_command, dark_mode } from '../objects/stores';
    import type { TransportAction } from '../objects/stores';
    import { onMount } from 'svelte';

    onMount(() => {
        $dark_mode = document.documentElement.classList.contains('dark');
    });

    function toggleDarkMode() {
        $dark_mode = !$dark_mode;
        document.documentElement.classList.toggle('dark', $dark_mode);
        localStorage.setItem('theme', $dark_mode ? 'dark' : 'light');
    }

    import { tweened } from 'svelte/motion';
    import { cubicInOut } from 'svelte/easing';

    // Play triangle split into two quads that morph into the two pause bars
    const PLAY_LEFT = [7, 4, 13.5, 7.2, 13.5, 16.8, 7, 20];
    const PAUSE_LEFT = [6, 5, 10, 5, 10, 19, 6, 19];
    const PLAY_RIGHT = [13.5, 7.2, 20, 12, 20, 12, 13.5, 16.8];
    const PAUSE_RIGHT = [14, 5, 18, 5, 18, 19, 14, 19];

    const morph = tweened($is_playing ? 1 : 0, { duration: 300, easing: cubicInOut });
    $: $morph = $is_playing ? 1 : 0;

    function lerpPoints(from: number[], to: number[], t: number): string {
        const out: string[] = [];
        for (let i = 0; i < from.length; i += 2) {
            out.push(`${from[i] + (to[i] - from[i]) * t},${from[i + 1] + (to[i + 1] - from[i + 1]) * t}`);
        }
        return out.join(' ');
    }

    $: leftPoints = lerpPoints(PLAY_LEFT, PAUSE_LEFT, $morph);
    $: rightPoints = lerpPoints(PLAY_RIGHT, PAUSE_RIGHT, $morph);

    let command_count = 0;
    function sendTransport(action: TransportAction) {
        $transport_command = { action, n: ++command_count };
    }
    
    $repeat_mix = false;

    function toggleRepeat() {
        $repeat_mix = !($repeat_mix);
    }
</script>

<main class="header_layout">
    <div>
        <h1 class="mt-2 dark:text-silver text-charcoal web_title">Kairo Mixes</h1>
    </div>
    <div class="flex justify-between">
        <!--<a class="self-center dark:text-translucent-violet text-muddy-violet" href="/">Newest Mix</a>-->
        <button class="transport_button theme_toggle" title={$dark_mode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode" aria-pressed={$dark_mode} on:click={toggleDarkMode}>
            <svg class="theme_icon" class:is_dark={$dark_mode} viewBox="0 0 24 24" aria-hidden="true">
                <mask id="theme_moon_mask">
                    <rect width="24" height="24" fill="white" />
                    <circle class="theme_moon_cut" cx="17" cy="7" r="6" fill="black" />
                </mask>
                <circle class="theme_body" cx="12" cy="12" r="9" fill="currentColor" mask="url(#theme_moon_mask)" />
                <g class="theme_rays" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="12" y1="1.5" x2="12" y2="4" />
                    <line x1="12" y1="20" x2="12" y2="22.5" />
                    <line x1="1.5" y1="12" x2="4" y2="12" />
                    <line x1="20" y1="12" x2="22.5" y2="12" />
                    <line x1="4.6" y1="4.6" x2="6.4" y2="6.4" />
                    <line x1="17.6" y1="17.6" x2="19.4" y2="19.4" />
                    <line x1="4.6" y1="19.4" x2="6.4" y2="17.6" />
                    <line x1="17.6" y1="6.4" x2="19.4" y2="4.6" />
                </g>
            </svg>
        </button>
        <div class="transport_controls">
            <button class="transport_button" title="Previous mix" aria-label="Previous mix" on:click={() => sendTransport('prev')}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>
            </button>
            <button class="transport_button" title={$is_playing ? 'Pause' : 'Play'} aria-label={$is_playing ? 'Pause' : 'Play'}
                on:click={() => sendTransport('toggle')}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points={leftPoints} />
                    <polygon points={rightPoints} />
                </svg>
            </button>
            <button class="transport_button" title="Next mix" aria-label="Next mix" on:click={() => sendTransport('next')}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5l11 7L4 19z"/></svg>
            </button>
        </div>
        <input type="range" class="volume_slider" title="Global volume" aria-label="Global volume"
            min="0" max="1" step="0.01" bind:value={$global_volume} />
        <button title="Toggles whether the mix loops or plays the next mix." class="repeat_button" class:repeat_off={!$repeat_mix}
            aria-label="Repeat mix" aria-pressed={$repeat_mix} on:click="{() => {toggleRepeat()}}">
            <svg class="repeat_button_img" viewBox="0 0 24 24" aria-hidden="true">
                <mask id="repeat_slash_mask">
                    <rect width="24" height="24" fill="white" />
                    <line class="repeat_slash_cut" x1="3" y1="3" x2="21" y2="21" stroke="black" stroke-width="4" stroke-linecap="round" pathLength="1" />
                </mask>
                <g mask="url(#repeat_slash_mask)">
                    <path class="repeat_arrows" fill="currentColor" d="M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z" />
                </g>
                <line class="repeat_slash" x1="3" y1="3" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" pathLength="1" />
            </svg>
        </button>
    </div>
</main>