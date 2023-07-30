<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';

    import { type Mix } from '../objects/mix';
    import { type Tracklist } from '../objects/tracklist';
    import { type Track } from '../objects/track';

	import TracklistModal from '../routes/tracklist_modal.svelte';

    export let mix_data: Mix[];
    export let tracklists: Tracklist[];

    let show_tracklist = false;
    let playing_tracks: Track[][] = [];

    for (let i = 0; i < mix_data.length; i++) {
        playing_tracks[i] = [];
    }

    let current_tracklist: Tracklist = tracklists[0];

    function play(trigger_mix: Mix, num_mixes: number) {
        for (let i = 0; i < num_mixes; i++) {
            if (i === trigger_mix.id - 1) continue;

            mix_data[i].playing = false;
            let audioplayer: HTMLAudioElement = document.getElementById((i + 1).toString()) as HTMLAudioElement;
            audioplayer.pause();
        }

        trigger_mix.playing = !trigger_mix.playing;

        let audioplayer: HTMLAudioElement = document.getElementById(trigger_mix.id.toString()) as HTMLAudioElement;

        if (trigger_mix.playing === true) {
            audioplayer.play();
            UpdatePlayingTracks();
        }
        else if (trigger_mix.playing === false) {
            audioplayer.pause();
        }
    }

    function PlayRequested(trigger_mix: Mix) {
        trigger_mix.playing = true;
        document.title = "Kairo Mixes: " + trigger_mix.name;
    }

    function PauseRequested(trigger_mix: Mix) {
        trigger_mix.playing = false;
        document.title = "Kairo Mixes";
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
        setInterval(UpdatePlayingTracks, 250);
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

</script>

<main class="inner_layout">
    {#each mix_data as mix}
        <button class="container" class:playing={mix.playing} id="b{mix.id}" on:click="{() => {play(mix, mix_data.length);}}">
            <div class="title">{mix.name.toUpperCase()}</div>
            <img class="image" src={mix.cover_path} alt="">           
            <ul class="playing_track_list" id="playing_tracks{mix.id}" >
                {#if mix.playing}
                    <li class="playing_track" transition:fade>Current Tracks</li>
                    {#each playing_tracks[mix.id - 1] as track (track.id)}
                        <li in:fly={{x: 50}} out:fly={{x: -50}} animate:flip class="playing_track" id="track{track.id}">{track.artist} - {track.title}</li>
                    {/each}
                {/if}
            </ul>          
            <audio class="player" id={mix.id.toString()} src={mix.audio_file_path} controls loop on:play="{() => {PlayRequested(mix)}}" on:pause="{() => {PauseRequested(mix)}}"></audio>
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

<style lang="scss">
    .inner_layout {
        grid-column: 2/3;
        grid-row: 2/2;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        grid-template-rows: repeat(auto-fit, minmax(500px, 1fr));
        padding: 8px;
        gap: 0.5em;
    }

    .container {
        position: relative;
        transition: 0.3s;
        max-width: 750px;
    }

    .image {
        size: 100%;
        overflow: hidden;
        position: relative;
        z-index: 0;
    }

    .title {
        @apply text-dark-violet;
        position: absolute;
        font-size: 35px;
        font-family: Helvetica;
        text-shadow: 2px 2px #DAD5EA;
        letter-spacing: 5px;
        top: 15%;
        left: 15%;
        width: 70%;
        height: 10%;
        background: transparent;
        opacity: 1;
        backdrop-filter: blur(10px);
        border-radius: 20px;
        overflow: hidden;
        text-align: center;
        z-index: 20;
    }

    audio::-webkit-media-controls-play-button {
        color: white;
    }

    audio::-webkit-media-controls-enclosure {
        @apply stroke-dark-violet;

        stroke-width: 5px;
        stroke-opacity: 1;
        background: transparent;
        opacity: 1;
        backdrop-filter: blur(10px);
    }

    .player {
        position: absolute;
        z-index: 10;
        width: 70%;
        top: 70%;
        left: 15%;
    }

    @keyframes spin {
        from {transform: translate(-50%, -50%) rotate(0);}
        to   {transform: translate(-50%, -50%) rotate(360deg);}
    }

    .tracklist_btn {
        position: absolute;
        font-size: 20px;
        font-family: Helvetica;
        text-shadow: 2px 2px #DAD5EA;
        letter-spacing: 5px;
        z-index: 30;
        background: transparent;
        backdrop-filter: blur(10px);
        border-radius: 10px;
        padding: 5px;
        bottom: 15px;
        right: 15px;
        transition: 0.2s;
    }

    .tracklist_btn:hover {
        overflow: hidden;

        --border-radius: 0.2rem;
        --border-size: 0.2rem;
        --border-bg: conic-gradient(#DAD5EA, #0f041a, #DAD5EA, #0f041a, #DAD5EA);
        --padding: 0rem;

        font-size: 2rem;
        padding: calc(var(--padding) + var(--border-size));
        border-radius: var(--border-radius);
        display: inline-block;

        &::before {
            content: '';
            display: block;
            background: var(--border-bg);
            width: calc(100% * 1.41421356237);
            padding-bottom: calc(100% * 1.41421356237);
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 100%;
            z-index: -2;
            animation: spin 5s linear infinite;
        }

        // &--reverse::before {
        //     animation-direction: reverse;
        // }

        &::after {
            content: '';
            position: absolute;
            inset: var(--border-size);
            @apply dark:bg-dark-violet bg-translucent-violet;
            z-index: -1;
            border-radius: calc(var(--border-radius) - var(--border-size));
        }
    }

    .container:hover {
        overflow: hidden;

        --border-radius: 0.5rem;
        --border-size: 0.5rem;
        --border-bg: conic-gradient(#DAD5EA, #0f041a, #DAD5EA, #0f041a, #DAD5EA);
        --padding: 0rem;

        position: relative;
        overflow: hidden;
        font-size: 2rem;
        padding: calc(var(--padding) + var(--border-size));
        border-radius: var(--border-radius);
        display: inline-block;
        z-index: 0;

        &::before {
            content: '';
            display: block;
            background: var(--border-bg);
            width: calc(100% * 1.41421356237);
            padding-bottom: calc(100% * 1.41421356237);
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 100%;
            z-index: -2;
            animation: spin 5s linear infinite;
        }

        // &--reverse::before {
        //     animation-direction: reverse;
        // }

        &::after {
            content: '';
            position: absolute;
            inset: var(--border-size);
            background: white;
            z-index: -1;
            border-radius: calc(var(--border-radius) - var(--border-size));
        }
    }

    .playing {
        overflow: hidden;

        --border-radius: 0.2rem;
        --border-size: 0.2rem;
        --border-bg: conic-gradient(#DAD5EA, #0f041a, #DAD5EA, #0f041a, #DAD5EA);
        --padding: 0rem;

        position: relative;
        overflow: hidden;
        font-size: 2rem;
        padding: calc(var(--padding) + var(--border-size));
        border-radius: var(--border-radius);
        display: inline-block;

        &::before {
            content: '';
            display: block;
            background: var(--border-bg);
            width: calc(100% * 1.41421356237);
            padding-bottom: calc(100% * 1.41421356237);
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            border-radius: 100%;
            z-index: -2;
            animation: spin 5s linear infinite;
        }

        // &--reverse::before {
        //     animation-direction: reverse;
        // }

        &::after {
            content: '';
            position: absolute;
            inset: var(--border-size);
            background: white;
            z-index: -1;
            border-radius: calc(var(--border-radius) - var(--border-size));
        }
    }

    .scrollable_list {
        @apply dark:text-translucent-violet text-dark-violet;

        padding: 10px;
        overflow: hidden;
        overflow-y: scroll;
        max-height: 70vh;
    }

    h2 {
        @apply dark:text-translucent-violet text-dark-violet;

        font-size: 20px;
        font-family: Helvetica;
        letter-spacing: 3px;
    }

    .playing_track_list {
        z-index: 30;
        position: absolute;
        z-index: 30;
        background: transparent;
        top: 40%;
        width: 70%;
        left: 15%;
        text-align: center;
        opacity: 1;
    }

    .playing_track {
        font-size: 15px;
        font-family: Helvetica;
        text-shadow: 2px 2px #DAD5EA;
        letter-spacing: 5px;
        backdrop-filter: blur(10px);
        border-radius: 10px;
        text-align: center;
        width: 100%;
        margin: 2px;
    }

    @keyframes fadeOut {
        0% { opacity: 1; }
        100% { opacity: 0; }
    }

    @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }
</style>