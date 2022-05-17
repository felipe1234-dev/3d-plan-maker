<?php 
namespace ThreeDPlanMaker;

class PluginCore {
    public string $root;
    public string $plugin_dir_url;
    public string $post_type;
    public array $post_data;
    public array $dependencies;
    public object $post_editor;
    public object $post_widget;
    
    public function __construct( array $settings = array() ) {
        $this->root           = $settings["root"];
        $this->plugin_dir_url = $settings["plugin_dir_url"];
        $this->post_type      = $settings["post_settings"]["post_type"];
        $this->post_data      = $settings["post_settings"]["args"];
        $this->post_editor    = new PostEditor( $this->root."/admin",  $settings["editor_settings"] );
        $this->post_widget    = new PostWidget( $this->root."/public", $settings["editor_settings"] );
    }

    /**
     * Verifica se o usuário está na tela de edição do plugin.
     */
    public function isAdmin() : bool {
        require_once ABSPATH."wp-admin/includes/screen.php";
        
        $screen = get_current_screen();
        
        return (bool)$screen ? $screen->id === $this->post_type : false;
    }
    
    /**
     * Compila SCSS em CSS.
     * @param $files - Uma array com os caminhos (absolutos) dos arquivos a serem compilados.
     * @return       - Os caminhos dos arquivos que foram compilados em forma de array associativa, 
     * na qual a chave é o caminho original e o valor é o caminho do compilado.
     */
    private function compileSCSS( array $files = array(), &$cached ) : array {
        $compiled_files = array();
        
        foreach ( $files as $path ) {
            preg_match( "/\.(\w+)$/", $path, $matches );
            $file_type = $matches[1];
            
            if ( $file_type !== "scss") {
                continue;
            }
            
            $compiler          = new \ScssPhp\ScssPhp\Compiler();
            $orig_file_path    = $path;
            $orig_file_content = file_get_contents( $this->root."/$orig_file_path" );
            $sub_folder        = $this->isAdmin()? "admin" : "public";
                
            $compiler->setImportPaths(
                $this->root."/$sub_folder/scss/utils/" 
            );
                    
            $compile_path = $this->root."/".str_replace( 
                [ "/scss/", ".scss" ], 
                [ "/css/", ".css" ], 
                $orig_file_path 
            );
            
            $compiled_file_content = $compiler->compileString( $orig_file_content )->getCss();
            
            if ( !file_exists( $compile_path ) || $compiled_file_content !== $orig_file_content ) {
                file_put_contents( $compile_path, $compiled_file_content );
            } else {
                $cached[ $orig_file_path ] = str_replace( $this->root."/", "", $compile_path );
            }
            
            $compiled_files[ $orig_file_path ] = str_replace( $this->root."/", "", $compile_path );
        }
        
        return $compiled_files;
    }
    
    /**
     * Minifica os arquivos.
     * @param $files  - Uma array com os caminhos (absolutos) dos arquivos a serem minificados.
     * @param $cached - Uma array associativa na qual a chave é o caminho original e o valor é o 
     * caminho do minificado contendo os arquivos que não foram alterados desde a última minificação.
     * @return        - Os caminhos dos arquivos que foram minifcados em forma de array associativa, 
     * na qual a chave é o caminho original e o valor o caminho do minificado.
     */
    private function minify( array $files = array(), &$cached ) : array {
        $minified_files = array();
        
        /*
         * Exclui arquivos que já foram minificados (extensão .min) e coloca
         * os que já foram minificados no cache.
         */
        foreach ( $files as $i => $path ) {
            $was_minified = (bool)preg_match( "/\.min\.\w+$/", $path );
            
            if ( $was_minified ) {
                unset( $files[ $i ] );
                $cached[ $path ] = $path;
            }
        }
        
        foreach ( $files as $path ) {
            preg_match( "/\.(\w+)$/", $path, $matches );
            $file_type = $matches[1];
            
            preg_match( "/.*\/(.*)$/", $path, $matches );
            $orig_file_path    = $path;
            $orig_file_path    = $this->root."/$orig_file_path";
            $orig_file_name    = $matches[1];
            $orig_file_content = file_exists( $orig_file_path ) ? file_get_contents( $orig_file_path ) : "";
            
            $minified_file_name  = preg_replace( "/\\.(\w+)$/", ".min.\\1", $orig_file_name );
            $minified_file_path  = $this->root."/";
            $minified_file_path .= $this->isAdmin() ? "admin" : "public";
            $minified_file_path .= "/build/".$minified_file_name;
            $minifier;

            if ( $file_type == "js" ) {
                $minifier = new \MatthiasMullie\Minify\JS( $orig_file_content );
            } else if ( $file_type == "css" ) {
                $minifier = new \MatthiasMullie\Minify\CSS( $orig_file_content );
            } else {
                continue;
            }
            
            $new_minified_code = $minifier->minify();
            $old_minified_code = file_exists( $minified_file_path ) ? file_get_contents( $minified_file_path ) : "";
            
            if ( $old_minified_code !== $new_minified_code ) {
                file_put_contents( $minified_file_path, $new_minified_code );
            } else {
                $cached[ $path ] = str_replace( $this->root."/", "", $minified_file_path );
            }
            
            $minified_files[ $path ] = str_replace( $this->root."/", "", $minified_file_path );
        }
        
        return $minified_files;
    }
    
    /**
     * "Echoa" as dependências do plugin.
     * @param $files - Array de strings dos caminhos para os arquivos, com relação ao root do plugin.
     */
    public function loadDeps( array $files = array() ) : void {
        $cached = array();
        
        $compiled_files = $this->compileSCSS( $files, $cached );
        
        foreach ( $compiled_files as $orig_path => $new_path ) {
            $i = array_search( $orig_path, $files );
            $files[ $i ] = $new_path;
        }
        
        $minified_files = array();
        
        if ( __MODE__ === "prod" ) {
            $minified_files = $this->minify( $files, $cached );
        }
        
        foreach ( $minified_files as $orig_path => $new_path ) {
            $i = array_search( $orig_path, $files );
            $files[ $i ] = $new_path;
        }
        
        foreach ( $files as $path ) {
            preg_match( "/\.(\w+)$/", $path, $matches );
            $file_type = $matches[1];
               
            $url = $this->plugin_dir_url.$path;
            /**
             * Se o arquivo não está dentro da lista de caches (e __MODE__ === "prod"), 
             * significa que foi alterado, então, forçamos o navegador a pegar a versão 
             * mais atualizada com a data atual no final da url.
             */
            $no_cache = __MODE__ === "dev" || (__MODE__ === "prod" && !in_array( $path, $cached ) );
            $sufix = $no_cache ? "?".date( "YmdHi" ) : "";
              
            switch ( $file_type ) {
                case "js":
                    echo "<script type=\"text/javascript\" src=\"$url$sufix\"></script>";
                    break;
                case "css":
                    echo "<link rel=\"stylesheet\" href=\"$url$sufix\" />";
                    break;
                default:
                    break;
            }
        }
    }
     
    public function startEditor() : void {
        $plugin = $this;
        add_meta_box(
            "model-scene",       // id
            "Cena",              // title
            function( object $post ) use ( $plugin ) : void {
                $plugin->post_editor->setPost($post->ID);
                $plugin->post_editor->render();
            },                   // callback
            $this->post_type,     // screen(s)
            "advanced",          // context
            "default",           // priority
        );
    }
    
    public function activate() : void {
        register_post_type( $this->post_type, $this->post_data );
        flush_rewrite_rules();
    }
    
    public function deactivate() : void {
        unregister_post_type( $this->post_type );
        flush_rewrite_rules();
    }
}