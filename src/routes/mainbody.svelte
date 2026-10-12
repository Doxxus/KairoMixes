<script lang="ts">
    import '../sass/mainbody.scss';

    import { onMount, tick } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    import type { Mix } from '../objects/mix';
    import type { Tracklist } from '../objects/tracklist';
    import type { Track } from '../objects/track';

    import { repeat_mix, global_volume, is_playing, transport_command } from '../objects/stores';

    export let mix_data: Mix[];
    export let tracklists: Tracklist[];

    let open_mix_id: number | null = null;
    let playing_tracks: Track[][] = [];
    let last_mix_index = 0;

    function GetPlayer(index: number): HTMLAudioElement {
        return document.getElementById(mix_data[index].id.toString()) as HTMLAudioElement;
    }

    function CurrentMixIndex(): number {
        const playing = mix_data.findIndex((mix) => mix.playing);
        return playing >= 0 ? playing : last_mix_index;
    }

    function SwitchToMix(index: number) {
        const count = mix_data.length;
        index = ((index % count) + count) % count;

        for (let i = 0; i < count; i++) {
            if (i !== index) GetPlayer(i).pause();
        }

        const target = GetPlayer(index);
        target.currentTime = 0;
        target.play();
    }

    function TogglePlayPause() {
        const player = GetPlayer(CurrentMixIndex());
        if (player.paused) player.play();
        else player.pause();
    }

    function HandleTransport(action: string) {
        if (action === 'toggle') TogglePlayPause();
        else if (action === 'next') SwitchToMix(CurrentMixIndex() + 1);
        else if (action === 'prev') SwitchToMix(CurrentMixIndex() - 1);
    }

    $: $is_playing = mix_data.some((mix) => mix.playing);
    $: {
        const playing = mix_data.findIndex((mix) => mix.playing);
        if (playing >= 0) last_mix_index = playing;
    }
    $: if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = $is_playing ? 'playing' : 'paused';
        const mix = mix_data[last_mix_index];
        if (mix) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: mix.name,
                artist: 'Kairo Mixes',
                artwork: mix.cover_path ? [{ src: mix.cover_path }] : []
            });
        }
    }

    for (let i = 0; i < mix_data.length; i++) {
        playing_tracks[i] = [];
    }


    function play(trigger_mix: Mix) {
        for (let i = 0; i < mix_data.length; i++) {
            if (i === trigger_mix.id - 1) continue;

            mix_data[i].playing = false;
            let audioplayer: HTMLAudioElement = document.getElementById((i + 1).toString()) as HTMLAudioElement;
            audioplayer.pause();
        }

        trigger_mix.playing = !trigger_mix.playing;

        let audioplayer: HTMLAudioElement = document.getElementById(trigger_mix.id.toString()) as HTMLAudioElement;

        if (trigger_mix.playing === true) {
            audioplayer.play();
        }
        else if (trigger_mix.playing === false) {
            audioplayer.pause();
        }
    }

    function PlayRequested(trigger_mix: Mix) {
        trigger_mix.playing = true;
        mix_data = mix_data;

        document.title = "Kairo Mixes: " + trigger_mix.name;
        UpdatePlayingTracks();
    }

    function PauseRequested(trigger_mix: Mix) {
        trigger_mix.playing = false;
        mix_data = mix_data;

        document.title = "Kairo Mixes";
        UpdatePlayingTracks();
    }

    const PANEL_MS = 400;
    let palettes: Record<number, string> = {};

    function RgbToHsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        const d = max - min;
        if (d === 0) return [0, 0, l];
        const s = d / (1 - Math.abs(2 * l - 1));
        let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h = (h * 60 + 360) % 360;
        return [h, s, l];
    }

    function OnCoverLoad(mix_id: number, event: Event) {
        ExtractPalette(mix_id, event.currentTarget as HTMLImageElement);
    }

    // Picks the two most prominent (vivid-weighted) hues in the cover and builds panel colours from them.
    function ExtractPalette(mix_id: number, img: HTMLImageElement) {
        if (!img.naturalWidth) return;
        try {
            const size = 48;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, size, size);
            const data = ctx.getImageData(0, 0, size, size).data;

            const hue_weights = new Array(12).fill(0);
            const hue_sat = new Array(12).fill(0);
            let total = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 128) continue;
                const [h, s, l] = RgbToHsl(data[i], data[i + 1], data[i + 2]);
                const weight = s * (1 - Math.abs(2 * l - 1)) + 0.01;
                const bucket = Math.floor(h / 30) % 12;
                hue_weights[bucket] += weight;
                hue_sat[bucket] += weight * s;
                total += weight;
            }
            if (!total) return;

            const order = hue_weights.map((w, i) => i).sort((a, b) => hue_weights[b] - hue_weights[a]);
            const primary = order[0];
            const secondary = hue_weights[order[1]] > total * 0.1 ? order[1] : primary;
            const hue = (b: number) => b * 30 + 15;
            const sat = (b: number) => Math.min(0.75, Math.max(0.25, hue_sat[b] / (hue_weights[b] || 1)));

            const h1 = hue(primary), s1 = Math.round(sat(primary) * 100);
            const h2 = hue(secondary), s2 = Math.round(sat(secondary) * 100);
            palettes[mix_id] = [
                `--tl-bg1:hsl(${h1} ${s1}% 74%)`,
                `--tl-bg2:hsl(${h2} ${s2}% 60%)`,
                `--tl-text:hsl(${h1} ${Math.min(s1, 60)}% 8%)`,
                `--tl-accent:hsl(${h2} ${s2}% 24%)`
            ].join(';');
            palettes = palettes;
        } catch { /* canvas blocked: keep default palette */ }
    }
    let expanded_mix_id: number | null = null;
    let card_size: { w: number; h: number } | null = null;
    let collapse_timer: ReturnType<typeof setTimeout> | undefined;

    // Applies a layout change and slides the other cards from their old positions to their new ones.
    async function Reflow(change: () => void) {
        const wraps = Array.from(document.querySelectorAll<HTMLElement>('.mix_wrap'));
        const before = wraps.map((wrap) => wrap.getBoundingClientRect());

        change();
        await tick();

        wraps.forEach((wrap, i) => {
            const after = wrap.getBoundingClientRect();
            const dx = before[i].left - after.left;
            const dy = before[i].top - after.top;
            if (!dx && !dy) return;
            wrap.animate(
                [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
                { duration: PANEL_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
            );
        });
    }

    function ToggleTracklist(mix_id: number) {
        if (tracklists.length < mix_id) return;

        clearTimeout(collapse_timer);

        if (open_mix_id === mix_id) {
            open_mix_id = null;
            collapse_timer = setTimeout(() => {
                Reflow(() => { expanded_mix_id = null; card_size = null; });
            }, PANEL_MS);
            return;
        }

        const card = document.getElementById('b' + mix_id) as HTMLElement;
        Reflow(() => {
            // Pin the cover size so it doesn't shrink when its grid cell grows.
            card_size = { w: card.offsetWidth, h: card.offsetHeight };
            expanded_mix_id = mix_id;
            open_mix_id = mix_id;
        });
    }

    function UpdatePlayingTracks() {
        let audioplayer: HTMLAudioElement = document.getElementById(mix_data[0].id.toString()) as HTMLAudioElement;
        let tracklist_id: number = mix_data[0].id;

        for (let i = 0; i < mix_data.length; i++) {
            if (!mix_data[i].playing) continue;
            audioplayer = document.getElementById(mix_data[i].id.toString()) as HTMLAudioElement;
            tracklist_id = mix_data[i].id;
            break;
        }

        if (tracklists[tracklist_id - 1] == undefined) return;

        playing_tracks[tracklist_id - 1] = [];

        tracklists[tracklist_id - 1].tracks.forEach((track) => {
            if (track.start_time < audioplayer.currentTime && track.end_time > audioplayer.currentTime) {
                playing_tracks[tracklist_id - 1] = [...playing_tracks[tracklist_id - 1], track];
            }
        });
    }

    onMount(() => {
        document.querySelectorAll<HTMLImageElement>('img.image').forEach((img, i) => {
            if (img.complete && mix_data[i]) ExtractPalette(mix_data[i].id, img);
        });

        setInterval(UpdatePlayingTracks, 500);

        const unsubscribe = global_volume.subscribe((volume) => {
            document.querySelectorAll('audio').forEach((audio) => {
                audio.volume = volume;
            });
        });

        let handled = -1;
        const unsubscribeTransport = transport_command.subscribe((cmd) => {
            if (!cmd || cmd.n === handled) return;
            handled = cmd.n;
            HandleTransport(cmd.action);
        });

        const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
            ['play', () => { const p = GetPlayer(CurrentMixIndex()); p.play(); }],
            ['pause', () => { GetPlayer(CurrentMixIndex()).pause(); }],
            ['nexttrack', () => HandleTransport('next')],
            ['previoustrack', () => HandleTransport('prev')]
        ];
        if ('mediaSession' in navigator) {
            actions.forEach(([name, handler]) => {
                try { navigator.mediaSession.setActionHandler(name, handler); } catch { /* unsupported */ }
            });
        }

        return () => {
            unsubscribe();
            unsubscribeTransport();
            if ('mediaSession' in navigator) {
                actions.forEach(([name]) => {
                    try { navigator.mediaSession.setActionHandler(name, null); } catch { /* unsupported */ }
                });
            }
        };
    });

    function GetTimeFromSeconds(sec_value: number) : string {
        let ret: string = "";
        let minutes: number = Math.floor(sec_value / 60);
        let seconds: number = sec_value % 60;

        ret += minutes.toString() + ':';
        if (seconds < 10) ret += '0';
        ret += seconds.toString();

        return ret;
    }

    function UpdateCursorHalo(event: PointerEvent) {
        const card = event.currentTarget as HTMLElement;

        card.querySelectorAll<HTMLElement>('.title, .current_track_item, .playing_track, .tracklist_btn')
            .forEach((element) => {
                const bounds = element.getBoundingClientRect();
                element.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
                element.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
            });
    }

    function OnTrackEnd(trigger_mix: Mix) {       
        let audioplayer: HTMLAudioElement;
        
        if ($repeat_mix) {
            audioplayer = document.getElementById(trigger_mix.id.toString()) as HTMLAudioElement;
        }     
        else if (trigger_mix.id == mix_data.length) {
            audioplayer = document.getElementById(mix_data[0].id.toString()) as HTMLAudioElement;
        }
        else {
            audioplayer = document.getElementById((trigger_mix.id + 1).toString()) as HTMLAudioElement;
        }

        audioplayer.play();
    }
</script>

<main class="inner_layout">
    {#each mix_data as mix}
        <div class="mix_wrap" style={palettes[mix.id] ?? ''} class:open={open_mix_id === mix.id} class:expanded={expanded_mix_id === mix.id}>
        <button class="container" class:playing={mix.playing} id="b{mix.id}"
            style={expanded_mix_id === mix.id && card_size ? `width:${card_size.w}px;height:${card_size.h}px;flex:none` : ''}  on:click="{() => {play(mix);}}" on:pointermove={UpdateCursorHalo}>
            <div class="title"><h1>{mix.name.toUpperCase()}</h1></div>
            <img class="image" src={mix.cover_path} alt="" on:load={(e) => OnCoverLoad(mix.id, e)}>
            <ul class="playing_track_list" id="playing_tracks{mix.id}" >
                {#if mix.playing}
                    <li class="current_track_item" transition:fade>Current Tracks</li>
                    {#each playing_tracks[mix.id - 1] as track (track.id)}
                        <li in:fly={{x: 50}} out:fly={{x: -50}} animate:flip class="playing_track" id="track{track.id}">{track.artist} - {track.title}</li>
                    {/each}
                {/if}
            </ul>          
            <audio class="player" id={mix.id.toString()} src={mix.audio_file_path} controls controlsList="nodownload" 
                on:play="{() => {PlayRequested(mix)}}" on:pause="{() => {PauseRequested(mix)}}" on:ended={() => {OnTrackEnd(mix)}}>
            </audio>
            <button class="tracklist_btn" id="{mix.name}_tracklist" aria-expanded={open_mix_id === mix.id} aria-controls="tracklist_panel{mix.id}"
                on:click|stopPropagation="{() => {ToggleTracklist(mix.id)}}">{open_mix_id === mix.id ? 'CLOSE' : 'TRACKLIST'}</button>
        </button>
        <aside class="tracklist_panel" id="tracklist_panel{mix.id}" aria-hidden={open_mix_id !== mix.id}>
            <div class="tracklist_inner">
                <h2>{mix.name.toUpperCase()}</h2>
                <ol class="scrollable_list">
                    {#each tracklists[mix.id - 1]?.tracks ?? [] as track}
                        <li>
                            [{GetTimeFromSeconds(track.start_time)} - {GetTimeFromSeconds(track.end_time)}]. {track.artist} - {track.title}
                        </li>
                    {/each}
                </ol>
            </div>
        </aside>
        </div>
    {/each}
</main>