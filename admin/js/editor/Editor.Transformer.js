Editor.Transformer = class {
    #setParam(param, value, object) {
        let newGeometry = object.clone().geometry;
        newGeometry.parameters[param] = value;

        const { type: geometryName, parameters: newParameters } = newGeometry;
        const { material: oldMaterial } = object;

        const args = [];

        Object.keys(newParameters).forEach((key) =>
            args.push(newParameters[key])
        );

        const updatedGeometry = new THREE[geometryName](...args);
        const newObject = new THREE.Mesh(updatedGeometry, oldMaterial);
        newGeometry = newObject.geometry;

        this.#editor._transformControls.detach();
        this.#editor._scene.remove(object);

        object.geometry = newGeometry;

        this.#editor._scene.add(object);
        this.#editor._transformControls.attach(object);
    }

    #setMap(option, value, object) {
        const { type, ...rest } = value;

        let refraction = null;
        if ("refraction" in rest) refraction = rest.refraction;
        let loader;

        const onLoadTexture = (texture, mapping) => {
            texture.mapping = mapping;
            texture.encoding = THREE.sRGBEncoding;
            
            object.material.setValues({
                [option]: texture,
            });
        };

        switch (true) {
            case /^uv*[-\s]*(texture|mapping)$/i.test(type):
                loader = new THREE.TextureLoader();
                loader.load(rest.url, (texture) =>
                    onLoadTexture(texture, THREE.UVMapping)
                );
                break;

            case /^equirect(angular)*[-\s]*(texture|mapping)$/i.test(type):
                loader = new THREE.TextureLoader();
                loader.load(rest.url, (texture) =>
                    onLoadTexture(
                        texture,
                        refraction
                            ? THREE.EquirectangularRefractionMapping
                            : THREE.EquirectangularReflectionMapping
                    )
                );
                break;

            case /^cube[-\s]*uv[-\s]*(texture|mapping)$/i.test(type):
                loader = new THREE.CubeTextureLoader();
                loader.load(rest.urls, (texture) => 
                    onLoadTexture(
                        texture,
                        refraction
                            ? THREE.CubeUVRefractionMapping
                            : THREE.CubeUVReflectionMapping
                    )
                );
                break;

            case /^cube[-\s]*(texture|mapping)$/i.test(type):
                loader = new THREE.CubeTextureLoader();
                loader.load(rest.urls, (texture) => 
                    onLoadTexture(
                        texture,
                        refraction
                            ? THREE.CubeRefractionMapping
                            : THREE.CubeReflectionMapping
                    )
                );
                break;

            default:
                object.material.setValues({
                    [option]: null,
                });
                break;
        }
    }

    #editor;
    #ref;

    constructor(editor) {
        this.#editor = editor;
        this.#ref = null;

        const scope = this;

        this.object = {
            get(option, object) {
                if (!scope.#ref && !object) return;

                const obj = !object ? scope.#ref : object;

                if (/(\w+\.)+/.test(option)) {
                    // o usuário/programador pode enviar um "caminho" de objeto
                    // em pontos: "prop1.prop2.prop3..."
                    return eval(`obj.${option}`);
                } else if (/shadow[-\s]*\w+/i.test(option)) {
                    option = option.replace(/(shadow|[-\s]+)/gi, "");
                    option =
                        option[0].toLowerCase() +
                        option.slice(1, option.length);

                    return obj.shadow[option];
                } else if (/color/i.test(option)) {
                    const { r, g, b } = obj[option];
                    const color = new THREE.Color(r, g, b);

                    return color.getHexString();
                } else if (/(position|scale|rotation)[XYZ]/i.test(option)) {
                    const prop = option.match(/(\w+)[XYZ]/i)[1].toLowerCase();
                    const axis = option.match(/[XYZ]/i)[0].toLowerCase();

                    if (prop in obj) {
                        if (axis in obj[prop]) {
                            return eval(`obj.${prop}.${axis}`);
                        }
                    }
                } else if (/^type$/i.test(option)) {
                    return obj.constructor.name;
                } else {
                    option = option.replace(/[\s-]+([A-Z])/g, "$1");
                    return obj[option];
                }
            },

            set(option, value, object) {
                if (!scope.#ref && !object) return;

                if (/(\w+\.)+/.test(option)) {
                    // o usuário/programador pode enviar um "caminho" de objeto
                    // em pontos: "prop1.prop2.prop3..."
                    return eval(`object.${option}`);
                } else if (/shadow[-\s]*\w+/i.test(option)) {
                    option = option.replace(/(shadow|[-\s]+)/gi, "");
                    option =
                        option[0].toLowerCase() +
                        option.slice(1, option.length);

                    object.shadow[option] = value;
                } else if (/color/i.test(option)) {
                    object[option] = new THREE.Color(value);
                } else if (/(position|scale|rotation)[XYZ]/i.test(option)) {
                    const prop = option
                        .match(/(\w+)[\s-]*[XYZ]/i)[1]
                        .toLowerCase();
                    const axis = option.match(/[XYZ]/i)[0].toLowerCase();

                    if (prop in object) {
                        if (axis in object[prop]) {
                            object[prop][axis] = value;
                        }
                    }
                } else {
                    object[option] = value;
                }

                scope.#editor.viewport.getHelper(object).update();
            },
        };

        this.geometry = {
            get(option, object) {
                let geom;

                if (scope.#ref) {
                    if ("geometry" in scope.#ref) geom = scope.#ref.geometry;
                }

                if (object) {
                    if ("geometry" in object) geom = object.geometry;
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
            },

            set(option, value, object) {
                if (!scope.#ref && !object) return;

                if (/(\w+\.)+/.test(option)) {
                    // o usuário/programador pode enviar um "caminho" de objeto
                    // em pontos: "prop1.prop2.prop3..."
                    return eval(`object.${option}`);
                } else if (
                    "parameters" in object.geometry &&
                    option in object.geometry.parameters
                ) {
                    scope.#setParam(option, value, object);
                } else {
                    object.geometry[option] = value;
                }

                scope.#editor.viewport.getHelper(object).update();
            },
        };

        this.material = {
            get(option, object) {
                let mat;

                if (scope.#ref) {
                    if ("material" in scope.#ref) mat = scope.#ref.material;
                }

                if (object) {
                    if ("material" in object) mat = object.material;
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
                            object: null,
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
            },

            set(option, value, object) {
                if (!scope.#ref && !object) return;

                if (/(\w+\.)+/.test(option)) {
                    // o usuário/programador pode enviar um "caminho" de objeto
                    // em pontos: "prop1.prop2.prop3..."
                    eval(`object.material.${option} = value`);
                } else if (/^type$/i.test(option)) {
                    let material = new THREE[value]();
                    object.material = material;
                } else if (
                    /color$/i.test(option) ||
                    /^emissive$/i.test(option)
                ) {
                    object.material.setValues({
                        [option]: new THREE.Color(value),
                    }); 
                } else if (/map$/i.test(option)) {
                    scope.#setMap(option, value, object);
                } else if (/^(side|blending)$/i.test(option)) {
                    object.material[option] = THREE[value];
                } else {
                    object.material.setValues({ [option]: value });
                }

                object.material.needsUpdate = true;
            },
        };

        const scopes = ["object", "geometry", "material"];

        scopes.forEach((key) => {
            const oldSet = scope[key].set;

            scope[key].set = function (
                option,
                value,
                feedHistory = true,
                object = null
            ) {
                const obj = !object ? scope.#ref : object;

                if (!scope.#editor._memory.has(obj.uuid))
                    scope.#editor._memory.create(obj.uuid);

                if (!scope.#editor._memory[obj.uuid].has(key))
                    scope.#editor._memory[obj.uuid].create(key);

                if (!scope.#editor._memory[obj.uuid][key].has(option)) {
                    scope.#editor._memory[obj.uuid][key].set({
                        [option]: this.get(option, obj),
                    });
                }

                oldSet.call(this, option, value, obj);

                if (feedHistory) {
                    const oldValueCopy = scope.#editor._memory[obj.uuid][key][option];
                    const objCopy = obj;

                    scope.#editor.history.add({
                        description: `Set object.${option} = ${
                            typeof value == "object"
                                ? JSON.stringify(value)
                                : value
                        }`,
                        undo: () =>
                            this.set(option, oldValueCopy, false, objCopy),
                        redo: () => this.set(option, value, false, objCopy),
                        always: () => scope.#editor.save(),
                    });

                    scope.#editor._memory.clear([obj.uuid]);
                }
            };
        });
    }
 
    getSelected() {
        return this.#ref;
    }
    
    hasSelected() {
        return !!this.#ref;
    }
    
    hasScope(scope) {
        return this.#ref && (scope in this.#ref || scope == "object");
    }

    select(object) {
        this.#ref = object;
        if (!/light/i.test(this.#ref.constructor.name))
            this.#editor.viewport.getHelper(this.#ref).visible =
                this.#editor.viewport.showHelpers;
        this.#editor._orbitControls.enabled = false;
        this.#editor._transformControls.attach(this.#ref);
        this.#editor._scene.add(this.#editor._transformControls);
        this.#editor.trigger("select", this.#editor);
    }

    unselect() {
        if (!/light/i.test(this.#ref.constructor.name))
            this.#editor.viewport.getHelper(this.#ref).visible = false;
        this.#ref = null;
        this.#editor._orbitControls.enabled = true;
        this.#editor._transformControls.detach();
        this.#editor._scene.remove(this.#editor._transformControls);
        this.#editor.trigger("unselect", this.#editor);
    }

    remove() {
        const object = this.#ref;

        this.unselect();

        this.#editor._scene.remove(object);
        this.#editor._scene.remove(this.#editor.viewport.getHelper(object));

        delete this.#editor._helpers[object.uuid];
    }
};
