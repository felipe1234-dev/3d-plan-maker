<?php
namespace ThreeDPlanMaker;

class PostWidget extends UI {
    public function render( array $atts ) : void {
        $post = $this->post;
        
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