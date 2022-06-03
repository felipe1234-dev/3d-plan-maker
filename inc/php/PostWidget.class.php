<?php
namespace ThreeDPlanMaker;

class PostWidget extends UI {
    public function render( array $atts ) : void {
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
        
        $context_names = array_keys( 
            json_decode( 
                wp_unslash($post->post_model),
                true
            ) 
        );
        
        $render_props = shortcode_atts(array(
            "id"        => "",
            "largura" 	=> "100%",
            "altura" 	=> "400px"
        ), $atts);
        
        ob_start();
        
        require $this->ui_folder."/templates/Widget.phtml";
        
        echo ob_get_clean();
    }
}