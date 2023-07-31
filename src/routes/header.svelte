<script lang="ts">
    import { repeat_mix } from '../objects/stores';
    
    let repeat_button_image: string = "/assets/no_repeat.png";
    $repeat_mix = false;

    function toggleRepeat() {
        $repeat_mix = !($repeat_mix);

        if ($repeat_mix) {
            repeat_button_image = "/assets/repeat_button.png";
        }
        
        else {
            repeat_button_image = "/assets/no_repeat.png";
        }
    }
</script>

<main class="header_layout">
    <div>
        <h1 class="mt-2 dark:text-translucent-violet text-dark-violet">Kairo Mixes</h1>
    </div>
    <div class="flex justify-between">
        <!--<a class="self-center dark:text-translucent-violet text-muddy-violet" href="/">Newest Mix</a>-->
        <button title="Toggles whether the mix loops or plays the next mix." class="repeat_button" on:click="{() => {toggleRepeat()}}">
            <img class="repeat_button_img" src={repeat_button_image} alt=""/>
        </button>
    </div>
</main>

<style lang="scss">
    @tailwind components;

    .header_layout {
        grid-column: 1/3;
        grid-row: 1/2;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: 1fr;
        padding: 5px;
        margin-top: 3px;
        margin-left: 20px;
        margin-bottom: 3px;
    }
    
    @media (max-width: 1000px) {
        h1 {
            @apply text-4xl;
            text-transform: uppercase;
            font-family: verdana;
            font-weight: 700;
            text-shadow: 1px 1px 1px #9a83b4,
                1px 2px 1px #9a83b4,
                1px 3px 1px #9a83b4,
                1px 4px 1px #9a83b4,
                1px 5px 1px #9a83b4,
            1px 18px 6px rgba(16,16,16,0.4),
            1px 22px 10px rgba(16,16,16,0.2),
            1px 25px 35px rgba(16,16,16,0.2),
            1px 30px 60px rgba(16,16,16,0.4);
        }
    }

    @media (min-width: 1000px) {
        h1 {
            @apply text-6xl;
            text-transform: uppercase;
            font-family: verdana;
            font-weight: 700;
            text-shadow: 1px 1px 1px #9a83b4,
                1px 2px 1px #9a83b4,
                1px 3px 1px #9a83b4,
                1px 4px 1px #9a83b4,
                1px 5px 1px #9a83b4,
            1px 18px 6px rgba(16,16,16,0.4),
            1px 22px 10px rgba(16,16,16,0.2),
            1px 25px 35px rgba(16,16,16,0.2),
            1px 30px 60px rgba(16,16,16,0.4);
        }
    }
    
    @layer components {
        .icon-correct-dark {
            filter: invert(30%) sepia(100%) hue-rotate(-155deg) saturate(3);
        }

        .icon-correct {
            filter: invert(20%) sepia(100%) hue-rotate(-155deg) saturate(4);
        }
    }

    .repeat_button {
        top: 30px;
        position: absolute;
        right: 5%;
    }

    .repeat_button_img {
        width: 40px;
        height: 35px;
        
        @apply dark:icon-correct-dark icon-correct;
    } 

    /* a:hover {
        font-weight: 700;
        font-size: 20px;
        border-bottom: 1px solid black;
    } */
</style>