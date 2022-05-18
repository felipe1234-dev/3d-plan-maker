class EditorControls {
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
                        description: `Controles: ${option} = ${
                            typeof newVal === "object"
                                ? JSON.stringify(newVal)
                                : newVal
                        }`,
                        undo: () => set.call(scope, option, oldVal, false),
                        redo: () => set.call(scope, option, newVal, false),
                        always: () => editor.save()
                    });
                }
            }
        });
    }
    
    get(option) {
        if ( /zoom[\s_-]*Speed/i.test(option) ) {
            return this.#editor._orbitControls.zoomSpeed;
        } else if ( /transform[\s_-]*Mode/i.test(option) ) {
            return this.#editor._transformControls.mode;
        } else if ( /show[\s_-]*[XYZ]/i.test(option) ) {
            const axis = option.replace(/show[\s_-]*/i, "").toUpperCase();
            return this.#editor._transformControls[`show${axis}`];
        } 
    }
    
    set(option, value, feedHistory = true) {
        if ( /zoom[\s_-]*Speed/i.test(option) ) {
            this.#editor._orbitControls.zoomSpeed = value;
        } else if ( /transform[\s_-]*Mode/i.test(option) ) {
            this.#editor._transformControls.setMode(value);
        } else if ( /show[\s_-]*[XYZ]/i.test(option) ) {
            const axis = option.replace(/show[\s_-]*/i, "").toUpperCase();
            this.#editor._transformControls[`show${axis}`] = value;
        }
    }
}