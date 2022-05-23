<?php
/**
 * Plugin name: Criador de Plantas 3D
 * Description: test
 * Version: 10.0.0
 * Author: felipe-alves-dev
 * Author URI: https://felipe1234-dev.github.io/felipe-portfolio/
 */
declare( strict_types = 1 ); 

namespace ThreeDPlanMaker;

ini_set( "display_errors", "1" );
ini_set( "display_startup_errors", "1" );

if ( version_compare( PHP_VERSION, "5.6" ) < 0 ) {
    throw new Exception( '"Criador de Plantas 3D" exige PHP 5.6 ou acima' );
}

/* 
 * Modifique essa constante entre "prod" e "dev".
 * Quando é "prod", o plugin está em produção e pronto
 * para o usuário. Quando é "dev", está em manutenção.
 * Motivo: Quando o __MODE__ está em "prod", os arquivos
 * serão minificados (minified), o que os torna impróprios
 * para debugação.
 */
const __MODE__  = "prod";
$root           = dirname( __FILE__ );
$plugin_dir_url = plugin_dir_url( __FILE__ );

if ( ! class_exists( "\ScssPhp\ScssPhp\Compiler" ) ) {
    require_once "libs/scssphp-1.9.0/scss.inc.php";
}

if ( 
    ! class_exists( "\MatthiasMullie\Minify\JS" ) && 
    ! class_exists( "\MatthiasMullie\Minify\CSS" ) &&
    ! class_exists( "\MatthiasMullie\PathConverter\Converter" )
) {
    require_once "libs/minify-v1.3.63/minify.php";
    require_once "libs/path-converter-v1.1.3/path-converter.php";
}
    
require_once "inc/php/PluginCore.class.php";
require_once "inc/php/loadJSON.function.php";
require_once "inc/php/uploadFile.function.php";
require_once "inc/php/UI.class.php";
require_once "inc/php/PostEditor.class.php";
require_once "inc/php/PostWidget.class.php";

$dependencies    = loadJSON( $root."/config/dependencies.conf.json" );
$post_settings   = loadJSON( $root."/config/post-settings.conf.json" );
$editor_settings = loadJSON( $root."/config/editor-settings.conf.json" );

$plugin = new PluginCore(array(
    "root"            => $root,
    "plugin_dir_url"  => $plugin_dir_url,
    "post_settings"   => $post_settings, 
    "editor_settings" => $editor_settings 
));

// AJAX

add_action("wp_ajax_{$plugin->post_type}_file_upload", function() use ( $plugin ) : void {
    $resp = array();
    $subdir = wp_get_upload_dir()["subdir"]."/";
    $continue = true;
    $i = 0;
    
    while ($continue) {
        $field_name = "{$plugin->post_type}_file_upload_$i";
        
        if (isset($_FILES[$field_name])) {
            $resp[] = uploadFile($field_name, $subdir);
        } else {
            $continue = false;
        }
        
        $i++;
    }
    
    echo json_encode($resp);
    
    die();
});

// HEAD

add_action("wp_head", function() use ( $plugin, $dependencies ) : void { 
    $plugin->loadDeps( $dependencies["public"]["head"] ); 
});

add_action("admin_head", function() use ( $plugin, $dependencies ) : void {
    if ($plugin->isAdmin()) {
        // Global
        echo '
            <script id="3d-plan-maker-globals" type="text/javascript">
                const PlanMaker = '.json_encode(array(
                    "postType" => $plugin->post_type,
                    "editor"   => null,
                    "ajaxURL"  => admin_url( "admin-ajax.php" ),
                    "upload"   => wp_get_upload_dir(),
                )).';
            </script>
        ';
        
        $plugin->loadDeps( $dependencies["admin"]["head"] ); 
    }
});

add_action("admin_enqueue_scripts", function() use ( $plugin ) : void {
    if ($plugin->isAdmin()) { 
        wp_enqueue_media();
        wp_enqueue_script( "jquery" );
        wp_enqueue_script( "jquery-ui-core" );
        wp_enqueue_script( "jquery-ui-tabs" );
        wp_enqueue_script( "jquery-ui-tooltip" );
        wp_enqueue_script( "jquery-ui-accordion" );
        wp_enqueue_script( "jquery-ui-sortable" );
    }
});

add_action("wp_enqueue_scripts", function() use ( $plugin ) : void {
    wp_enqueue_script( "jquery" );
});

// FOOTER

add_action("wp_footer", function() use ( $plugin, $dependencies ) : void {
    $plugin->loadDeps( $dependencies["public"]["footer"] ); 
});

add_action("admin_footer", function() use ( $plugin, $dependencies ) : void {
    if ($plugin->isAdmin()) {
        $plugin->loadDeps( $dependencies["admin"]["footer"] ); 
    }
});

// EDITOR

add_action("add_meta_boxes", function() use ( $plugin ) : void {
    $plugin->startEditor();
});

add_action("save_post", function( int $post_ID ) use ( $plugin ) : void {
    $plugin->post_editor->setPost( $post_ID );
    $plugin->post_editor->savePost();
});

add_action("admin_menu", function() : void {
	// Featured image
	remove_meta_box( "postimagediv", "page", "normal" );
	// Page attributes
	remove_meta_box( "pageparentdiv", "page", "normal" );
});

// SHORTCODE 

add_shortcode("modelo-3d", function( array $atts ) use ( $plugin ) : string {
    if ( is_page() ) {
        $plugin->post_widget->setPost( (int)$atts["id"] );
        
        ob_start();
        
        $plugin->post_widget->render( $atts );
        
        return ob_get_clean();
    }
});

// (DE)ACTIVATION

add_action("init", function() use ( $plugin ) : void {
    $plugin->activate();
});

register_activation_hook(__FILE__, function() use ( $plugin ) : void {
    $plugin->activate();
});

register_deactivation_hook(__FILE__, function() use ( $plugin ) : void {
    $plugin->deactivate();
});

// COLUMNS

add_action("manage_{$plugin->post_type}_posts_columns", function( array $columns ) : array {
    $columns["3dmodel_id"] = "ID";
    return $columns;
});

add_action("manage_{$plugin->post_type}_posts_custom_column", function( string $column, int $post_ID ) : void {
    if ($column == "3dmodel_id") {
        echo $post_ID;
    }
}, 10, 2);

add_action("manage_{$plugin->post_type}_posts_columns", function( array $columns ) : array {
    $columns["shortcode"] = "Shortcode";
    return $columns;
});

add_action("manage_{$plugin->post_type}_posts_custom_column", function( string $column, int $post_ID ) : void {
    if ($column == "shortcode") {
        echo "[modelo-3d id=\"$post_ID\" largura=\"100%\" altura=\"400px\"]";
    }
}, 10, 2);