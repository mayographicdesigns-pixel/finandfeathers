<?php get_header(); ?>
<main id="primary" class="site-main">
    <section class="hero-section min-h-[80vh] flex items-center justify-center bg-zinc-900 relative">
        <div class="relative z-20 text-center px-4">
            <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">
                ELEVATED DINING
                <br />
                <span class="text-red-600">MEETS SOUTHERN SOUL</span>
            </h1>
            <div class="flex justify-center gap-4">
                <a href="#menu" class="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded">VIEW FULL MENU</a>
                <a href="#locations" class="border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold py-4 px-8 rounded">FIND A LOCATION</a>
            </div>
        </div>
    </section>
    <div class="bg-red-900 text-white text-center py-3 text-sm font-semibold sticky top-20 z-40">
        All checks feature a 20% automatic gratuity
    </div>
    <section class="page-content px-4 py-12 max-w-7xl mx-auto">
        <?php
        if ( have_posts() ) :
            while ( have_posts() ) :
                the_post();
                the_content();
            endwhile;
        else :
            echo '<p>No content found.</p>';
        endif;
        ?>
    </section>
</main>
<?php get_footer(); ?>
