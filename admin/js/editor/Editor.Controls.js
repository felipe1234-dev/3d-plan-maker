Editor.Controls = class {
    #editor; 
    constructor(editor) {
        this.#editor = editor;
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
        if (!this.#editor._memory.has("controls")) 
            this.#editor._memory.create("controls");
                        
        if (!this.#editor._memory["controls"].has(option)) {
            this.#editor._memory["controls"].set({
                [option]: this.get(option)
            }); 
        }
        
        if ( /zoom[\s_-]*Speed/i.test(option) ) {
            this.#editor._orbitControls.zoomSpeed = value;
        } else if ( /transform[\s_-]*Mode/i.test(option) ) {
            this.#editor._transformControls.setMode(value);
        } else if ( /show[\s_-]*[XYZ]/i.test(option) ) {
            const axis = option.replace(/show[\s_-]*/i, "").toUpperCase();
            this.#editor._transformControls[`show${axis}`] = value;
        }
        
        if (feedHistory) {
            const oldValueCopy = this.#editor._memory["controls"][option];
                        
            this.#editor.history.add({
                description: `Set controls.${option} = ${value}`,
                undo: () => this.set(option, oldValueCopy, false),
                redo: () => this.set(option, value, false)
            });
        
            this.#editor._memory.clear([ "controls" ]);
        }
    }
}