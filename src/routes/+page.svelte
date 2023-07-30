<script lang="ts">
    import Header from "../routes/header.svelte";
    import Mainbody from "../routes/mainbody.svelte";

    import mix_data from "../mixes.json";
    import tracklist_data from "../tracklists.json";
</script>

<main class = "layout">
    <Header></Header>
    <Mainbody mix_data={mix_data.mixes} tracklists={tracklist_data.tracklists}></Mainbody>
</main>

<style lang="scss">
    .layout {
        display: grid;
        grid-template-columns: 50px 3fr 50px;
        grid-template-rows: 80px auto;
    }
</style>