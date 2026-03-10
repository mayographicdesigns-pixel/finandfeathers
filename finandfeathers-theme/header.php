<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class( 'bg-black text-white' ); ?>>
<?php wp_body_open(); ?>
<header class="fnf-header fixed w-full z-50 bg-black bg-opacity-90 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-20">
            <div class="flex-shrink-0 flex items-center">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="text-2xl font-bold text-red-600">
                    <?php bloginfo('name'); ?>
                </a>
            </div>
            <nav class="hidden md:flex space-x-8">
                <?php
                wp_nav_menu( array(
                    'theme_location' => 'primary-menu',
                    'container'      => false,
                    'menu_class'     => 'flex space-x-8 text-white font-medium hover:text-red-500 transition-colors',
                    'fallback_cb'    => false,
                ) );
                ?>
            </nav>
        </div>
    </div>
</header>
<div class="pt-20">
