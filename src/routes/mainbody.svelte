<script lang="ts">
    import '../sass/mainbody.scss';

    import { onMount, tick } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    import type { Mix } from '../objects/mix';
    import type { Tracklist } from '../objects/tracklist';
    import type { Track } from '../objects/track';

    import TransportControls from './transport_controls.svelte';

    import { repeat_mix, is_playing, transport_command, play_request, dark_mode } from '../objects/stores';

    export let mix_data: Mix[];
    export let tracklists: Tracklist[];

    let open_mix_id: number | null = null;
    let playing_tracks: Track[][] = [];
    let last_mix_index = 0;

    function GetPlayerById(mix_id: number): HTMLAudioElement {
        return document.getElementById(mix_id.toString()) as HTMLAudioElement;
    }

    function GetPlayer(index: number): HTMLAudioElement {
        return GetPlayerById(mix_data[index].id);
    }

    function PauseOthers(keep_mix_id: number) {
        for (const mix of mix_data) {
            if (mix.id !== keep_mix_id) GetPlayerById(mix.id).pause();
        }
    }

    function CurrentMixIndex(): number {
        const playing = mix_data.findIndex((mix) => mix.playing);
        return playing >= 0 ? playing : last_mix_index;
    }

    function SwitchToMix(index: number) {
        const count = mix_data.length;
        index = ((index % count) + count) % count;

        PauseOthers(mix_data[index].id);

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

    function TogglePlayMix(mix: Mix) {
        PauseOthers(mix.id);

        const audioplayer = GetPlayerById(mix.id);
        if (audioplayer.paused) audioplayer.play();
        else audioplayer.pause();
    }

    function PlayFromTrack(mix: Mix, track: Track) {
        PauseOthers(mix.id);

        const audioplayer = GetPlayerById(mix.id);
        audioplayer.currentTime = track.start_time;
        audioplayer.play();
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
            palette_params[mix_id] = [h1, s1, h2, s2];
            palette_params = palette_params;
        } catch { /* canvas blocked: keep default palette */ }
    }

    // Dark mode keeps the dark tinted glass; light mode swaps it for a pale tint of the same hues.
    function BuildPalette([h1, s1, h2, s2]: number[], dark: boolean): string {
        const glass_s = Math.min(s1, 45);
        const shared = [
            `--tl-bg1:hsl(${h1} ${s1}% 74%)`,
            `--tl-bg2:hsl(${h2} ${s2}% 60%)`,
            `--tl-text:hsl(${h1} ${Math.min(s1, 60)}% 8%)`,
            `--tl-accent:hsl(${h2} ${s2}% 24%)`,
            `--mix-ring-a:hsl(${h1} ${Math.max(s1, 55)}% 70%)`,
            `--mix-ring-b:hsl(${h2} ${Math.min(s2, 50)}% ${dark ? 16 : 38}%)`
        ];
        const themed = dark ? [
            `--mix-glass:hsl(${h1} ${glass_s}% 9% / 0.6)`,
            `--mix-glass-strong:hsl(${h1} ${glass_s}% 9% / 0.78)`,
            `--mix-glass-solid:hsl(${h1} ${glass_s}% 8% / 0.96)`,
            `--mix-halo:hsl(${h1} ${Math.max(s1, 40)}% 80% / 0.38)`,
            `--mix-halo-soft:hsl(${h1} ${Math.max(s1, 40)}% 80% / 0.16)`,
            `--mix-edge:hsl(${h2} ${Math.max(s2, 40)}% 85% / 0.35)`,
            `--mix-ink:hsl(${h1} ${Math.min(s1, 40)}% 96%)`
        ] : [
            `--mix-glass:hsl(${h1} ${Math.max(s1, 55)}% 76% / 0.78)`,
            `--mix-glass-strong:hsl(${h1} ${Math.max(s1, 55)}% 79% / 0.88)`,
            `--mix-glass-solid:hsl(${h1} ${Math.max(s1, 55)}% 80% / 0.97)`,
            `--mix-halo:hsl(${h1} ${Math.max(s1, 40)}% 100% / 0.55)`,
            `--mix-halo-soft:hsl(${h1} ${Math.max(s1, 40)}% 100% / 0.25)`,
            `--mix-edge:hsl(${h2} ${Math.max(s2, 40)}% 30% / 0.35)`,
            `--mix-ink:hsl(${h1} ${Math.min(s1, 50)}% 10%)`
        ];
        return [...shared, ...themed].join(';');
    }

    let palette_params: Record<number, number[]> = {};
    let palettes: Record<number, string> = {};
    $: {
        palettes = {};
        for (const id in palette_params) palettes[id] = BuildPalette(palette_params[id], $dark_mode);
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

    // The pinned cover size goes stale when the viewport changes, so close any open tracklist.
    let last_inner_width = typeof window !== 'undefined' ? window.innerWidth : 0;
    function OnWindowResize() {
        if (window.innerWidth === last_inner_width) return;
        last_inner_width = window.innerWidth;
        if (open_mix_id === null && expanded_mix_id === null) return;
        clearTimeout(collapse_timer);
        open_mix_id = null;
        expanded_mix_id = null;
        card_size = null;
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
        }).then(() => ScrollToPlayingTrack(mix_id));
    }

    async function ScrollToPlayingTrack(mix_id: number) {
        UpdatePlayingTracks();
        await tick();

        const list = document.querySelector<HTMLElement>(`#tracklist_panel${mix_id} .scrollable_list`);
        const items = list?.querySelectorAll<HTMLElement>('li.now_playing');
        if (!list || !items || items.length === 0) return;

        // Center the span covering all currently playing tracks.
        const listTop = list.getBoundingClientRect().top;
        const first = items[0].getBoundingClientRect();
        const last = items[items.length - 1].getBoundingClientRect();
        const middle = (first.top + last.bottom) / 2 - listTop + list.scrollTop;
        list.scrollTo({ top: middle - list.clientHeight / 2, behavior: 'smooth' });
    }

    let last_playing_key = '';
    $: if (open_mix_id !== null) {
        const key = open_mix_id + ':' + (playing_tracks[open_mix_id - 1] ?? []).map((t) => t.id).join(',');
        if (key !== last_playing_key) {
            last_playing_key = key;
            ScrollToPlayingTrack(open_mix_id);
        }
    } else {
        last_playing_key = '';
    }

    function UpdatePlayingTracks() {
        const playing = mix_data.find((mix) => mix.playing) ?? mix_data[0];
        const tracklist = tracklists[playing.id - 1];
        if (tracklist == undefined) return;

        const time = GetPlayerById(playing.id).currentTime;
        playing_tracks[playing.id - 1] = tracklist.tracks.filter((track) => track.start_time < time && track.end_time > time);
    }

    onMount(() => {
        document.querySelectorAll<HTMLImageElement>('img.image').forEach((img, i) => {
            if (img.complete && mix_data[i]) ExtractPalette(mix_data[i].id, img);
        });

        const interval = setInterval(UpdatePlayingTracks, 500);

        let handled = -1;
        const unsubscribeTransport = transport_command.subscribe((cmd) => {
            if (!cmd || cmd.n === handled) return;
            handled = cmd.n;
            HandleTransport(cmd.action);
        });

        let handled_play = -1;
        const unsubscribePlay = play_request.subscribe((req) => {
            if (!req || req.n === handled_play) return;
            handled_play = req.n;
            const mix = mix_data.find((m) => m.id === req.mix_id);
            const track = tracklists[req.mix_id - 1]?.tracks.find((t) => t.id === req.track_id);
            if (mix && track) {
                PlayFromTrack(mix, track);
                document.getElementById('b' + mix.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
            ['play', () => { GetPlayer(CurrentMixIndex()).play(); }],
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
            clearInterval(interval);
            unsubscribeTransport();
            unsubscribePlay();
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

    function OnTrackEnd(trigger_mix: Mix) {
        const index = mix_data.indexOf(trigger_mix);
        const next = $repeat_mix ? index : (index + 1) % mix_data.length;
        GetPlayer(next).play();
    }
</script>

<svelte:window on:resize={OnWindowResize} />

<main class="inner_layout">
    {#each mix_data as mix}
        <div class="mix_wrap" class:playing={mix.playing} style={palettes[mix.id] ?? ''} class:open={open_mix_id === mix.id} class:expanded={expanded_mix_id === mix.id}>
        <button class="container" id="b{mix.id}"
            style={expanded_mix_id === mix.id && card_size ? `width:${card_size.w}px;height:${card_size.h}px;flex:none` : ''}  on:click="{() => TogglePlayMix(mix)}">
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
            <div class="bottom_banner">
            <TransportControls {mix}
                on:play={() => PlayRequested(mix)} on:pause={() => PauseRequested(mix)} on:ended={() => OnTrackEnd(mix)}
                on:toggle={() => TogglePlayMix(mix)} on:seek={UpdatePlayingTracks} />
            <button class="tracklist_btn" id="{mix.name}_tracklist" aria-expanded={open_mix_id === mix.id} aria-controls="tracklist_panel{mix.id}"
                on:click|stopPropagation="{() => {ToggleTracklist(mix.id)}}">{open_mix_id === mix.id ? 'CLOSE' : 'TRACKLIST'}</button>
            </div>
        </button>
        <aside class="tracklist_panel" id="tracklist_panel{mix.id}" aria-hidden={open_mix_id !== mix.id}>
            <div class="tracklist_inner">
                <h2>{mix.name.toUpperCase()}</h2>
                <ol class="scrollable_list">
                    {#each tracklists[mix.id - 1]?.tracks ?? [] as track}
                        <li class:now_playing={mix.playing && playing_tracks[mix.id - 1]?.some((t) => t.id === track.id)}>
                            <button class="track_btn" on:click={() => PlayFromTrack(mix, track)}>
                                [{GetTimeFromSeconds(track.start_time)} - {GetTimeFromSeconds(track.end_time)}]. {track.artist} - {track.title}
                            </button>
                        </li>
                    {/each}
                </ol>
            </div>
        </aside>
        </div>
    {/each}
</main>