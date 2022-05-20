class Editor3DElement {
    #editor;

    constructor(editor) {
        this.#editor = editor;
        this.ref     = null;

        this.object   = new ObjectScope(editor, this);
        this.geometry = new GeometryScope(editor, this);
        this.material = new MaterialScope(editor, this);
        
        const parent = this;
        ["object", "geometry", "material"].forEach((elemScope) => {
            this[elemScope].set = new Proxy(this[elemScope].set, {
                apply: function(set, scope, args) {
                    const feedHistory = args[2] === undefined ? true : args[2];
                    /* Se estiver undefined, significa que o usuário não passou o argumento, 
                     * logo, o valor padrão (true) é que vale.
                     */
                    let option;
                    let newVal;
                    let oldVal;
                    let elemName;
                    let ctxName;
                    
                    if (feedHistory) {
                        option   = args[0];
                        newVal   = args[1];
                        oldVal   = scope.get(option);
                        elemName = parent.ref.name;
                        ctxName  = editor.contexts.current.name;
                    }
                    
                    set.call(scope, ...args);
                    
                    if (feedHistory) {
                        editor.history.add({
                            description: 
                                `${ctxName} > ${elemName}: ${elemScope}.${option} = ${
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
        });
    }
 
    getSelected() {
        return this.ref;
    }
    
    hasSelected() {
        return !!this.ref;
    }
    
    /**
     * 
     * @param {"object" | "geometry" | "material"} scope 
     * @returns {boolean}
     */
    hasScope(scope) {
        return this.ref && (scope in this.ref || scope === "object");
    }

    select(element3D) {
        this.ref = element3D;
        
        if (!/light/i.test(this.ref.constructor.name))
            this.#editor.viewport.getHelper(this.ref).visible =
                this.#editor.viewport.showHelpers;
        
        this.#editor._orbitControls.enabled = false;
        this.#editor._transformControls.attach(this.ref);
        this.#editor._currentScene.add(this.#editor._transformControls);
        
        this.#editor.trigger("select", this.#editor);
    }

    unselect() {
        if (!/light/i.test(this.ref.constructor.name))
            this.#editor.viewport.getHelper(this.ref).visible = false;
            
        this.ref = null;
        this.#editor._orbitControls.enabled = true;
        this.#editor._transformControls.detach();
        this.#editor._currentScene.remove(this.#editor._transformControls);
        
        this.#editor.trigger("unselect", this.#editor);
    }

    remove() {
        this.#editor.scene.remove(this.ref);
    }
}

class Scope {
    constructor(editor, parent) {
        this._editor = editor;
        this._parent = parent;
    }
    
    get _elem3D() {
        return this._parent.ref;
    }
}

class ObjectScope extends Scope {
    get(option) {
        if (/(\w+\.)+/.test(option)) {
            /* O usuário/programador pode enviar um "caminho" de objeto
             * em pontos: "prop1.prop2.prop3...".
             */
            return eval(`this._elem3D.${option}`);
        } else if (/shadow[-\s]*\w+/i.test(option)) {
            option = option.replace(/(shadow|[-\s]+)/gi, "");
            option =
                option[0].toLowerCase() +
                option.slice(1, option.length);

            return this._elem3D.shadow[option];
        } else if (/color/i.test(option)) {
            const { r, g, b } = this._elem3D[option];
            const color = new THREE.Color(r, g, b);

            return color.getHexString();
        } else if (/(position|scale|rotation)[XYZ]/i.test(option)) {
            const prop = option.match(/(\w+)[XYZ]/i)[1].toLowerCase();
            const axis = option.match(/[XYZ]/i)[0].toLowerCase();

            if (prop in this._elem3D) {
                if (axis in this._elem3D[prop]) {
                    return eval(`this._elem3D.${prop}.${axis}`);
                }
            }
        } else if (/^type$/i.test(option)) {
            return this._elem3D.constructor.name;
        } else {
            option = option.replace(/[\s-]+([A-Z])/g, "$1");
            return this._elem3D[option];
        }
    }

    set(option, value, feedHistory = true) {
        if (/(\w+\.)+/.test(option)) {
            // o usuário/programador pode enviar um "caminho" de objeto
            // em pontos: "prop1.prop2.prop3..."
            return eval(`this._elem3D.${option}`);
        } else if (/shadow[-\s]*\w+/i.test(option)) {
            option = option.replace(/(shadow|[-\s]+)/gi, "");
            option =
                option[0].toLowerCase() +
                option.slice(1, option.length);

            this._elem3D.shadow[option] = value;
        } else if (/color/i.test(option)) {
            this._elem3D[option] = new THREE.Color(value);
        } else if (/(position|scale|rotation)[XYZ]/i.test(option)) {
            const prop = option
                .match(/(\w+)[\s-]*[XYZ]/i)[1]
                .toLowerCase();
            const axis = option
                .match(/[XYZ]/i)[0]
                .toLowerCase();

            if (prop in this._elem3D) {
                if (axis in this._elem3D[prop]) {
                    this._elem3D[prop][axis] = value;
                }
            }
        } else {
            this._elem3D[option] = value;
        }

        this._editor.viewport.getHelper(this._elem3D).update();
    }
}

class GeometryScope extends Scope {
    get(option) {
        let geom;

        if (this._elem3D) {
            if ("geometry" in this._elem3D) geom = this._elem3D.geometry;
        }

        if (!geom) return;

        if (/(\w+\.)+/.test(option)) {
            // o usuário/programador pode enviar um "caminho" de objeto
            // em pontos: "prop1.prop2.prop3..."
            return eval(`geom.${option}`);
        } else if ("parameters" in geom && option in geom.parameters) {
            option = option.replace(/[\s-]+([A-Z])/g, "$1");
            return geom.parameters[option];
        } else if (/^type$/i.test(option)) {
            return geom.constructor.name;
        } else {
            option = option.replace(/[\s-]+([A-Z])/g, "$1");
            return geom[option];
        }
    }

    set(option, value, feedHistory = true) {
        if (/(\w+\.)+/.test(option)) {
            // o usuário/programador pode enviar um "caminho" de objeto
            // em pontos: "prop1.prop2.prop3..."
            return eval(`this._elem3D.geometry.${option}`);
        } else if (
            "parameters" in this._elem3D.geometry &&
            option in this._elem3D.geometry.parameters
        ) {
            this._elem3D.geometry.setParam(option, value);
        } else {
            this._elem3D.geometry[option] = value;
        }

        this._editor.viewport.getHelper(this._elem3D).update();
    }
}

class MaterialScope extends Scope {
    get(option) {
        let mat;

        if (this._elem3D) {
            if ("material" in this._elem3D) mat = this._elem3D.material;
        }

        if (!mat) return;

        if (/(\w+\.)+/.test(option)) {
            // o usuário/programador pode enviar um "caminho" de objeto
            // em pontos: "prop1.prop2.prop3..."
            return eval(`mat.${option}`);
        } else if (
            /color$/i.test(option) ||
            /^emissive$/i.test(option)
        ) {
            const { r, g, b } = mat[option];
            const color = new THREE.Color(r, g, b);

            return color.getHexString();
        } else if (/map$/i.test(option)) {
            if (!mat[option]) {
                return {
                    element3D: null,
                    type: "None",
                };
            } else if (mat[option].image) {
                return mat[option].editorData;
            }
        } else if (/^side$/i.test(option)) {
            switch (mat.side) {
                case THREE.FrontSide:
                    return "FrontSide";
                case THREE.BackSide:
                    return "BackSide";
                case THREE.DoubleSide:
                    return "DoubleSide";

                default:
                    break;
            }
        } else if (/^blending$/i.test(option)) {
            switch (mat.blending) {
                case THREE.NoBlending:
                    return "NoBlending";
                case THREE.NormalBlending:
                    return "NormalBlending";
                case THREE.AdditiveBlending:
                    return "AdditiveBlending";
                case THREE.SubtractiveBlending:
                    return "SubtractiveBlending";
                case THREE.MultiplyBlending:
                    return "MultiplyBlending";

                default:
                    break;
            }
        } else if (/^type$/i.test(option)) {
            return mat.constructor.name;
        } else {
            option = option.replace(/[\s-]+([A-Z])/g, "$1");
            return mat[option];
        }
    }

    set(option, value, feedHistory = true) {
        if (!this._elem3D) return;

        if (/(\w+\.)+/.test(option)) {
            // o usuário/programador pode enviar um "caminho" de objeto
            // em pontos: "prop1.prop2.prop3..."
            eval(`this._elem3D.material.${option} = value`);
        } else if (/^type$/i.test(option)) {
            let material = new THREE[value]();
            this._elem3D.material = material;
        } else if (
            /color$/i.test(option) ||
            /^emissive$/i.test(option)
        ) {
            this._elem3D.material.setValues({
                [option]: new THREE.Color(value),
            }); 
        } else if (/map$/i.test(option)) {
            this._elem3D.material.setMap(option, value);
        } else if (/^(side|blending)$/i.test(option)) {
            this._elem3D.material[option] = THREE[value];
        } else {
            this._elem3D.material.setValues({ [option]: value });
        }

        this._elem3D.material.needsUpdate = true;
    }
}