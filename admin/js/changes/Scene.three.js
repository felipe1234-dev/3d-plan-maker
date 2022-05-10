Object.defineProperty(THREE.Scene.prototype, "editorData", {
    get: function editorData() {
        const getBgEditorData = () => {
            if (!this.background) {
                return {
                    object: null,
                    type: "None",
                };
            } else if (this.background.isColor) {
                return {
                    object: this.background,
                    type: "Color", 
                    color: this.background.getHexString(),
                };
            } else if (this.background.isTexture) {
                return this.background.editorData;
            } else {
                return {
                    object: null,
                    type: "None",
                };
            }
        };

        const getEnvEditorData = () => {
            if (!this.environment) {
                return {
                    object: null,
                    type: "None",
                };
            } else if (this.environment.isTexture) {
                return this.environment.editorData;
            } else {
                return {
                    object: null,
                    type: "None",
                };
            }
        };

        const getFogEditorData = () => {
            let data = {};

            if (!this.fog) {
                data = {
                    object: null,
                    type: "None",
                };
            } else {
                data = this.fog.editorData;
            }

            return data;
        };

        let data = {};

        data.background = getBgEditorData();
        data.environment = getEnvEditorData();
        data.fog = getFogEditorData();

        return data;
    },
});
