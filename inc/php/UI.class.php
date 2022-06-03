<?php 
namespace ThreeDPlanMaker;
 
class UI {
    public object $post;
    protected string $ui_folder;
    protected array $default_settings;
    
    public function __construct( string $folder, array $settings = array() ) {
        $this->ui_folder        = $folder;
        $this->default_settings = $settings;
    } 
    
    private function getPostMeta( string $key, string $single = "single" ) {
        return get_post_meta( $this->post->ID, $key, $single == "single" );
    }
    
    public function setPost( int $post_ID ) : void {
        $this->post = new \stdClass();
        
        foreach ( get_post( $post_ID ) as $key => $value ) {
            $this->post->{$key} = $value;
        }
        
        foreach ( $this->default_settings as $key => $default_value ) {
            $this->post->{$key} = (bool)$this->getPostMeta($key) ? $this->getPostMeta($key) : $default_value;
        }
    }
}