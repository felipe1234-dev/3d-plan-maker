class EditorRenderer {
    #editor;
    
    constructor(editor) {
        this.#editor = editor;
        
        this.set = new Proxy(this.set, {
            apply: function(set, scope, args) {
                const feedHistory = args[2] === undefined ? true : args[2];
                /* Se estiver undefined, significa que o usuário não passou o argumento, 
                 * logo, o valor padrão (true) é que vale.
                 */
                let option;
                let newVal;
                let oldVal;
            
                if (feedHistory) {
                    option  = args[0];
                    newVal  = args[1];
                    oldVal  = scope.get(option);
                }
                 
                set.call(scope, ...args);
                
                if (feedHistory) {
                    editor.history.add({
                        description: `Renderizador: ${option} = ${
                            typeof newVal === "object"
                                ? JSON.stringify(newVal)
                                : newVal
                        }`,
                        undo: () => set.call(scope, option, oldVal, false),
                        redo: () => set.call(scope, option, newVal, false)
                    });
                }
            }
        });
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
                this.#editor._currentScene.remove(this.#editor._transformControls);
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
                this.#editor._currentScene.add(this.#editor._transformControls);
            }
        }
    }
}