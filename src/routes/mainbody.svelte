<script lang="ts">
    import '../sass/mainbody.scss';

    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    import type { Mix } from '../objects/mix';
    import type { Tracklist } from '../objects/tracklist';
    import type { Track } from '../objects/track';

    import { repeat_mix, global_volume, is_playing, transport_command } from '../objects/stores';
	import TracklistModal from '../routes/tracklist_modal.svelte';

    export let mix_data: Mix[];
    export let tracklists: Tracklist[];

    let show_tracklist = false;
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

    let current_tracklist: Tracklist = tracklists[0];

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

    function OpenTracklist(mix_id: number) {
        if (tracklists.length < mix_id) return;

        current_tracklist = tracklists[mix_id - 1];
        show_tracklist = true;
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
        <button class="container" class:playing={mix.playing} id="b{mix.id}" on:click="{() => {play(mix);}}" on:pointermove={UpdateCursorHalo}>
            <div class="title"><h1>{mix.name.toUpperCase()}</h1></div>
            <img class="image" src={mix.cover_path} alt="">
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
            <button class="tracklist_btn" id="{mix.name}_tracklist" on:click|stopPropagation="{() => {OpenTracklist(mix.id)}}">TRACKLIST</button>
        </button>
    {/each}
    <TracklistModal bind:show_tracklist>
        <h2 slot="header">
            {current_tracklist.name.toUpperCase()}
        </h2>
        <ol class="scrollable_list" slot="track_content">
            {#each current_tracklist.tracks as track}
                <li>
                    [{GetTimeFromSeconds(track.start_time)} - {GetTimeFromSeconds(track.end_time)}]. {track.artist} - {track.title}
                </li>
            {/each}
        </ol>
    </TracklistModal>
</main>