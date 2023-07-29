<script>
    import Header from "../routes/header.svelte";
    import Mainbody from "../routes/mainbody.svelte";

    let mixdata_json = [[1, false, '/Covers/recalcitrant.jpg', '/Mixes/Recalcitrant.mp3', 'Recalcitrant'.toUpperCase()],
        [2, false, '/Covers/overtime.jpg', '/Mixes/Overtime.mp3', 'Overtime'.toUpperCase()],
        [3, false, '/Covers/outer_realms.jpg', '/Mixes/Outer_Realms.mp3', 'Outer Realms'.toUpperCase()],
        [4, false, '/Covers/trial.jpg', '/Mixes/Trial.mp3', 'Trial'.toUpperCase()],
        [5, false, '/Covers/firebomb.jpg', '/Mixes/Firebomb.mp3', 'Firebomb'.toUpperCase()]]
</script>
<main class = "layout">
    <Header></Header>
    <Mainbody mix_data={mixdata_json}></Mainbody>
</main>
<style lang="scss">

    .layout {
        display: grid;
        grid-template-columns: 50px 3fr 50px;
        grid-template-rows: 80px auto;
    }
</style>