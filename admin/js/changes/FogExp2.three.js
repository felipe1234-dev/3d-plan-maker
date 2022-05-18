Object.defineProperty(THREE.FogExp2.prototype, "editorData", {
    get: function editorData() {
        let data = {};

        const { r, g, b } = this.color;
        const color = new THREE.Color(r, g, b);

        data["type"] = "Exponential";
        data["color"] = color.getHexString();
        data["density"] = this.density;

        return data;
    },
});