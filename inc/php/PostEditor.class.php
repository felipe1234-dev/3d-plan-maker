<?php
namespace ThreeDPlanMaker;

class PostEditor extends UI {
    public function savePost() : void {
        $post_ID = (string)$this->post->ID;
        $fields = $this->default_settings;
        
        foreach ( $fields as $key => $default ) {
            $key_exists = array_key_exists($key, $_POST);
            $value = "";
            
            switch ( gettype($default) ) { 
                case "integer":
                    $value = !$key_exists ? $default : $_POST[ $key ];
                    break;
                    
                case "string":
                    $value = !$key_exists ? $default : $_POST[ $key ];
                    break;
                
                case "boolean":
                    $value = !$key_exists ? "0" : "1";
                    break;
                
                case "array": 
                    $value = !$key_exists ? wp_json_encode($default) : wp_slash($_POST[ $key ]);
                    break;
                    
                default:
                    break;
            }
            
            update_post_meta($post_ID, $key, $value);
        }
    }
    
    public function render() : void { 
        $post = $this->post;
        
        $consts = array();
        foreach ( glob( $this->ui_folder."/consts/*.json") as $filename ) {
            $json = file_get_contents($filename);
            $arr = json_decode($json, true);
            
            preg_match("/([\w-]+)\.json/", $filename, $matches);
            $key = $matches[1];
            $key = str_replace("-", "_", $key);
            
            $consts[$key] = $arr;
        } 
        
        extract($consts);
        
        $light_names = array_filter(
            array_keys( $objects ), 
            function( string $key ) : bool {
                return (bool)preg_match( "/light/i", $key );
            }
        );
        
        $lights = array();
        
        foreach ( $light_names as $i => $light_name ) {
            $lights[$light_name] = $objects[$light_name];
        }
        
        ob_start();
        
        require $this->ui_folder."/templates/Editor.phtml";
        
        echo ob_get_clean();
    } 
}