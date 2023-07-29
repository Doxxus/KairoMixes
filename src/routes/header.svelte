<script>

</script>
<main class="header_layout">
    <div>
        <h1 class="text-5xl mt-2 dark:text-translucent-violet text-muddy-violet">Kairo Mixes</h1>
    </div>
    <div class="flex justify-between">
        <!--<a class="self-center dark:text-translucent-violet text-muddy-violet" href="/">Newest Mix</a>-->
    </div>
</main>
<style>
    .header_layout {
        grid-column: 2/3;
        grid-row: 1/2;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: 1fr;
        padding: 5px;
        margin-top: 3px;
        margin-bottom: 3px;
    }

    a:hover {
        font-weight: 700;
        font-size: 20px;
        border-bottom: 1px solid black;
    }
</style>