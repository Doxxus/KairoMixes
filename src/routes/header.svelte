<script>

</script>

<main class="header_layout">
    <div>
        <h1 class="text-4xl mt-2 dark:text-translucent-violet text-dark-violet">Kairo Mixes</h1>
    </div>
    <div class="flex justify-between">
        <!--<a class="self-center dark:text-translucent-violet text-muddy-violet" href="/">Newest Mix</a>-->
    </div>
</main>

<style>
    .header_layout {
        grid-column: 1/2;
        grid-row: 1/2;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: 1fr;
        padding: 5px;
        margin-top: 3px;
        margin-left: 20px;
        margin-bottom: 3px;
    }
    
    h1 {
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

    /* a:hover {
        font-weight: 700;
        font-size: 20px;
        border-bottom: 1px solid black;
    } */
</style>