<script lang="ts">

    export let mix_data: any;

    function play(mix_id: number, num_mixes: number) {      
        
        for (let i = 0; i < num_mixes; i++) {
            if (i === mix_id - 1) continue;
            
            mix_data[i][1] = false;

            //let button: HTMLButtonElement = document.getElementById("b"+(i+1).toString()) as HTMLButtonElement;
            let audioplayer: HTMLAudioElement = document.getElementById((i + 1).toString()) as HTMLAudioElement;

            audioplayer.pause();

            // if (button.classList.contains('playing')) {
            //     button.classList.remove('playing');
            // }           
        }
        
        mix_data[mix_id - 1][1] = !mix_data[mix_id - 1][1];
        
        //let button: HTMLButtonElement = document.getElementById("b"+mix_id.toString()) as HTMLButtonElement;
        let audioplayer: HTMLAudioElement = document.getElementById(mix_id.toString()) as HTMLAudioElement;

        if (mix_data[mix_id - 1][1] === true) {        
            audioplayer.play();
        }
        else if (mix_data[mix_id - 1][1] === false) {
            audioplayer.pause();           
        }

        //button.classList.toggle('playing');
    }

</script>
<main class="inner_layout">
    {#each mix_data as mix}
        <button class="container" class:playing={mix[1]} id="b{mix[0]}" on:click="{() => {play(mix[0], mix_data.length);}}">
            <div class="title">{mix[4]}</div>
            <img class ="image" src={mix[2]} alt="">
            <audio class="player" id={mix[0]} src={mix[3]} controls loop></audio>
        </button>
    {/each}
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

    button:hover {
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
</style>