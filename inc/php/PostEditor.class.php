<?php
namespace ThreeDPlanMaker;

class PostEditor extends UI {
    public function savePost() : void {
        $fields = $this->default_settings;
        $result = array();
        
        foreach ($fields as $key => $default) {
            $key_exists = array_key_exists($key, $_POST);
            $final_value = "";
            $post_value = $_POST[ $key ];
            
            switch (gettype($default)) { 
                case "integer":
                    $final_value = !$key_exists || gettype($post_value) != "integer" ? $default : $post_value;
                    break;
                    
                case "string":
                    $final_value = !$key_exists || !$post_value ? $default : $post_value;
                    break;
                
                case "boolean":
                    $final_value = !$key_exists ? "0" : "1";
                    break;
                
                case "array": 
                    $final_value = !$key_exists || !$post_value ? $default : json_decode(wp_unslash($post_value), true);
                    break;
                    
                default:
                    break;
            }
            
            $result[ $key ] = $final_value;
        }
        
        $post_ID = (string)$this->post->ID;
        $upload_dir = wp_get_upload_dir();
        $target_path = "{$upload_dir["basedir"]}/models";
        
        if (!file_exists("$target_path/")) {
            mkdir("$target_path/");
        }
        
        file_put_contents("$target_path/$post_ID.json", json_encode($result));
    }
    
    public function render() : void {
        $post_ID = (string)$this->post->ID;
        $upload_dir = wp_get_upload_dir();
        $target_path = "{$upload_dir["basedir"]}/models";
        $model_path = "$target_path/$post_ID.json";
        
        $post = json_decode(
            file_exists($model_path) 
                ? file_get_contents($model_path) 
                : json_encode($this->default_settings)
        );
        
        $post = (object) array_merge((array) $this->post, (array) $post);
        
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