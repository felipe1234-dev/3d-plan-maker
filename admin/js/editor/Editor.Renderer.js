Editor.Renderer = class {
    #editor;
    
    constructor(editor) {
        this.#editor = editor;
    }
    
    get(option) {
        if ( !(option in this.#editor._renderer) ) {
            // testando com "nicknames"
            
            if ( /enable[\s_-]*Physical[\s_-]*Lights/i.test(option) ) {
                return this.#editor._renderer.physicallyCorrectLights;
            }
            
            if ( /shadow[\s_-]*Type/i.test(option) ) {
                return this.#editor._renderer.shadowMap.type;
            }
            
            if ( /enable[\s_-]*Shadows/i.test(option) ) {
                return this.#editor._renderer.shadowMap.enabled;
            }
            
            if ( /anti[\s_-]*alias(ing)*/i.test(option) ) {
                return this.#editor._renderer.userData.parameters.antialias;
            }
            
            // o usuário/programador pode enviar um "caminho" de objeto 
            // em pontos: "prop1.prop2.prop3..."
            if ( /(\w+\.)+/.test(option) ) {
                return eval(`this.#editor._renderer.${option}`);
            }
        } else {
            option = option.replace(/[\s_-]+([A-Z])/g, "$1");
            return this.#editor._renderer[option];
        }
    }
    
    set(option, value, feedHistory = true) {
        if (!this.#editor._memory.has("renderer")) 
            this.#editor._memory.create("renderer");
                        
        if (!this.#editor._memory["renderer"].has(option)) {
            this.#editor._memory["renderer"].set({
                [option]: this.get(option)
            }); 
        }
        
        if ( /enable[\s_-]*Physical[\s_-]*Lights/i.test(option) ) {
            this.#editor._renderer.physicallyCorrectLights = value;
            this.#editor._renderer.userData.properties.physicallyCorrectLights = value;
        } else if ( /shadow[\s_-]*Type/i.test(option) ) {
            this.#editor._renderer.shadowMap.type = value;
            this.#editor._renderer.userData.properties.shadowMap.type = value;
        } else if ( /enable[\s_-]*Shadows/i.test(option) ) {
            this.#editor._renderer.shadowMap.enabled = value;
            this.#editor._renderer.userData.properties.shadowMap.enabled = value;
        } else if (option in this.#editor._renderer) {
            this.#editor._renderer[option] = value;
            this.#editor._renderer.userData.properties[option] = value;
        } else {
            let attached;
            
            if (this.#editor._transformControls.object) {
                attached = this.#editor._transformControls.object;
                this.#editor._transformControls.detach();
                this.#editor._scene.remove(this.#editor._transformControls);
            }
            
            if ( /anti[\s_-]*alias(ing)*/i.test(option) ) {
                this.#editor._renderer.userData.parameters.antialias = value;
            } else {
                this.#editor._renderer.userData.parameters[option] = value;
            }
            
            this.#editor.model.loadRenderer({
                parameters: this.#editor._renderer.userData.parameters,
                properties: this.#editor._renderer.userData.properties
            });
            
            this.#editor.addDefaultEvents();
            
            if (attached) {
                this.#editor._transformControls.attach(attached);
                this.#editor._scene.add(this.#editor._transformControls);
            }
        }
        
        if (feedHistory) {
            const oldValueCopy = this.#editor._memory["renderer"][option];
                        
            this.#editor.history.add({
                description: `Set renderer.${option} = ${value}`,
                undo: () => this.set(option, oldValueCopy, false),
                redo: () => this.set(option, value, false),
                always: () => this.#editor.save()
            });
        
            this.#editor._memory.clear([ "renderer" ]);
        }
    }
}