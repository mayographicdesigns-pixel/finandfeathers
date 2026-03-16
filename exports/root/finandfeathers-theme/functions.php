<?php
function fnf_enqueue_scripts() {
    wp_enqueue_style( 'fnf-style', get_stylesheet_uri(), array(), '1.0.0' );
    wp_enqueue_style( 'fnf-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', false );
    wp_enqueue_script( 'tailwindcss', 'https://cdn.tailwindcss.com', array(), '3.4.1', false );
}
add_action( 'wp_enqueue_scripts', 'fnf_enqueue_scripts' );

function fnf_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'menus' );
    register_nav_menus( array(
        'primary-menu' => __( 'Primary Menu', 'fin-and-feathers' ),
        'footer-menu' => __( 'Footer Menu', 'fin-and-feathers' ),
    ) );
}
add_action( 'after_setup_theme', 'fnf_theme_setup' );
