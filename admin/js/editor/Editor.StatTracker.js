Editor.StatTracker = class {
    #editor;
    constructor(editor) {
        this.#editor = editor;
        
        this.groups     = 0; 
        this.objects    = 0;
        this.geometries = 0;
        this.lights     = 0;
        this.vertices   = 0; 
        this.triangles  = 0; 
        this.textures   = 0;
        this.position   = null;
    }
    
    update() {
        this.groups     = 0;
        this.objects    = 0;
        this.geometries = 0;
        this.lights     = 0;
        this.vertices   = 0;
        this.triangles  = 0;
        this.textures   = this.#editor.model.renderer.info.memory.textures;
        this.position   = this.#editor.model.camera.position;
        
        this.#editor._scene.children.forEach(object => {
            const isGroup = object.constructor.name == "Group";
                
            if (isGroup)
                this.groups++;
                
            const list = isGroup ? object.children : [ object ];
                
            list.forEach(child => {
                if (!child.visible) 
                    return;
                    
                this.objects++;
                
                if (child.isMesh)
                    this.geometries++;
                        
                if (child.isLight)
                    this.lights++;
                        
                if (child.isMesh) {
                    const geometry = child.geometry;
        
                    this.vertices += geometry.attributes.position.count;
                            
                    const count = geometry.index ? geometry.index.count : geometry.attributes.position.count;
                                
                    this.triangles += count/3;
                }
            });
        });
        
        this.#editor.trigger("statUpdate", this.#editor);
    }
}