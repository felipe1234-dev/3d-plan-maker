THREE.Color.prototype.getHexString = function () {
    let { r, g, b } = this;

    r *= 255;
    g *= 255;
    b *= 255;

    const hex =
        "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

    return hex;
};
