<script lang="ts">
    import '../sass/header.scss';
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
        <h1 class="mt-2 dark:text-translucent-violet text-dark-violet web_title">Kairo Mixes</h1>
    </div>
    <div class="flex justify-between">
        <!--<a class="self-center dark:text-translucent-violet text-muddy-violet" href="/">Newest Mix</a>-->
        <button title="Toggles whether the mix loops or plays the next mix." class="repeat_button" on:click="{() => {toggleRepeat()}}">
            <img class="repeat_button_img" src={repeat_button_image} alt=""/>
        </button>
    </div>
</main>