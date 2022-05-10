Editor.FileManager = class {
    #editor;
    constructor(editor, ) {
        this.#editor = editor;
    }

    /**
     * @public
     * @param {String} name - O nome da cena como chave no objeto ThreeDModel.scenes, se a cena já existe,
     * será substituída por esta.
     * @param {File}   file - O objeto representando o arquivo (retornado pelo input type="file").
     */
    importScene(name, file) {
        const filename = file.name;
        const extension = filename
            .match(/\.\w+$/)[0]
            .replace(".", "")
            .toLowerCase();
        const reader = new FileReader();

        const onParse = (output) => {
            if ("scene" in output || output.isScene) {
                const currentSceneName = this.#editor._scene;
                this.#editor._scenes[currentSceneName] = output.isScene ? output : output.scene;
            } else {
                console.error("")
            }
        }
        
        switch (extension) {
            case "3dm":
                reader.addEventListener(
                    "load",
                    async (event) => {
                        const loader = new THREE.Rhino3dmLoader();

                        loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@7.14.0/");
                        loader.parse(event.target.result, (object) => this.#scene.add(object));
                    },
                    false
                );

                reader.readAsArrayBuffer(file);
                break;

            case "3ds": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const { TDSLoader } = await import(
                            "../../examples/jsm/loaders/TDSLoader.js"
                        );

                        const loader = new TDSLoader();
                        const object = loader.parse(event.target.result);

                        editor.execute(new AddObjectCommand(editor, object));
                    },
                    false
                );
                reader.readAsArrayBuffer(file);

                break;
            }

            case "3mf": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const { ThreeMFLoader } = await import(
                            "../../examples/jsm/loaders/3MFLoader.js"
                        );

                        const loader = new ThreeMFLoader();
                        const object = loader.parse(event.target.result);

                        editor.execute(new AddObjectCommand(editor, object));
                    },
                    false
                );
                reader.readAsArrayBuffer(file);

                break;
            }

            case "amf": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const { AMFLoader } = await import(
                            "../../examples/jsm/loaders/AMFLoader.js"
                        );

                        const loader = new AMFLoader();
                        const amfobject = loader.parse(event.target.result);

                        editor.execute(new AddObjectCommand(editor, amfobject));
                    },
                    false
                );
                reader.readAsArrayBuffer(file);

                break;
            }

            case "dae": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const contents = event.target.result;

                        const { ColladaLoader } = await import(
                            "../../examples/jsm/loaders/ColladaLoader.js"
                        );

                        const loader = new ColladaLoader(manager);
                        const collada = loader.parse(contents);

                        collada.scene.name = filename;

                        editor.execute(
                            new AddObjectCommand(editor, collada.scene)
                        );
                    },
                    false
                );
                reader.readAsText(file);

                break;
            }

            case "glb": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const contents = event.target.result;

                        const { DRACOLoader } = await import(
                            "../../examples/jsm/loaders/DRACOLoader.js"
                        );
                        const { GLTFLoader } = await import(
                            "../../examples/jsm/loaders/GLTFLoader.js"
                        );

                        const dracoLoader = new DRACOLoader();
                        dracoLoader.setDecoderPath(
                            "../examples/js/libs/draco/gltf/"
                        );

                        const loader = new GLTFLoader();
                        loader.setDRACOLoader(dracoLoader);
                        loader.parse(contents, "", function (result) {
                            const scene = result.scene;
                            scene.name = filename;

                            scene.animations.push(...result.animations);
                            editor.execute(new AddObjectCommand(editor, scene));
                        });
                    },
                    false
                );
                reader.readAsArrayBuffer(file);

                break;
            }

            case "gltf": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const contents = event.target.result;

                        let loader;

                        if (isGLTF1(contents)) {
                            alert(
                                "Import of glTF asset not possible. Only versions >= 2.0 are supported. Please try to upgrade the file to glTF 2.0 using glTF-Pipeline."
                            );
                        } else {
                            const { DRACOLoader } = await import(
                                "../../examples/jsm/loaders/DRACOLoader.js"
                            );
                            const { GLTFLoader } = await import(
                                "../../examples/jsm/loaders/GLTFLoader.js"
                            );

                            const dracoLoader = new DRACOLoader();
                            dracoLoader.setDecoderPath(
                                "../examples/js/libs/draco/gltf/"
                            );

                            loader = new GLTFLoader(manager);
                            loader.setDRACOLoader(dracoLoader);
                        }

                        loader.parse(contents, "", function (result) {
                            const scene = result.scene;
                            scene.name = filename;

                            scene.animations.push(...result.animations);
                            editor.execute(new AddObjectCommand(editor, scene));
                        });
                    },
                    false
                );
                reader.readAsArrayBuffer(file);

                break;
            }

            case "js":
            case "json": {
                reader.addEventListener(
                    "load",
                    function (event) {
                        const contents = event.target.result;

                        // 2.0

                        if (contents.indexOf("postMessage") !== -1) {
                            const blob = new Blob([contents], {
                                type: "text/javascript",
                            });
                            const url = URL.createObjectURL(blob);

                            const worker = new Worker(url);

                            worker.onmessage = function (event) {
                                event.data.metadata = { version: 2 };
                                handleJSON(event.data);
                            };

                            worker.postMessage(Date.now());

                            return;
                        }

                        // >= 3.0

                        let data;

                        try {
                            data = JSON.parse(contents);
                        } catch (error) {
                            alert(error);
                            return;
                        }

                        handleJSON(data);
                    },
                    false
                );
                reader.readAsText(file);

                break;
            }

            case "kmz": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const { KMZLoader } = await import(
                            "../../examples/jsm/loaders/KMZLoader.js"
                        );

                        const loader = new KMZLoader();
                        const collada = loader.parse(event.target.result);

                        collada.scene.name = filename;

                        editor.execute(
                            new AddObjectCommand(editor, collada.scene)
                        );
                    },
                    false
                );
                reader.readAsArrayBuffer(file);

                break;
            }

            case "wrl": {
                reader.addEventListener(
                    "load",
                    async function (event) {
                        const contents = event.target.result;

                        const { VRMLLoader } = await import(
                            "../../examples/jsm/loaders/VRMLLoader.js"
                        );

                        const result = new VRMLLoader().parse(contents);

                        editor.execute(new SetSceneCommand(editor, result));
                    },
                    false
                );
                reader.readAsText(file);

                break;
            }

            default:
                console.error(`Unsupported file format (${extension}).`);
                break;
        }
    }
};
