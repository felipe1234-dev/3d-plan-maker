let points = null;

jQuery(document).ready(function ($) {
    points = {
        parent: null,

        start(parent) {
            this.parent = parent;
        },

        _setEvents() {
            $(this.parent)
                .find("#matrix div input")
                .on("input change", (event) => {
                    $(this.parent)
                        .find('input[type="hidden"]')
                        .trigger(event.type);
                });
        },

        _fixIndexes() {
            $(this.parent)
                .find("#matrix div span")
                .each(function (index) {
                    $(this).text(index);
                });
        },

        add(event) {
            event.preventDefault();

            const div = $("<div>")[0];

            $(div).append(`
                    <span class="Text" style="width: 20px;">
                        ${$(this.parent).find("#matrix div").length - 1}
                    </span>
                `);

            const baseInput = $("<input>", {
                class: "Number",
                style: "background-color: transparent; width: 50px;",
                type: "number",
                step: "0.01",
                value: "0",
            })[0];

            $(div).append($(baseInput).clone());
            $(div).append($(baseInput).clone());

            const button = $("<button>", { class: "Button" })[0];
            $(button).click(this.remove);
            $(button).text("-");

            $(div).append(button);

            $(this.parent).find("#matrix").append(div);

            $(this.parent).find('input[type="hidden"]').trigger("input");

            this._setEvents();
            this._fixIndexes();
        },

        remove(event) {
            event.preventDefault();

            $(event.target).parent().remove();
            $(this.parent).find('input[type="hidden"]').trigger("input");

            this._setEvents();
            this._fixIndexes();
        },

        render(vectors) {
            $(this.parent).find("#matrix").html("");

            vectors.forEach(({ x, y }, index) => {
                const div = $("<div>")[0];

                $(div).append(`
                        <span class="Text" style="width: 20px;">
                            ${index}
                        </span>
                    `);

                const baseInput = $("<input>", {
                    class: "Number",
                    style: "background-color: transparent; width: 50px;",
                    type: "number",
                    step: "0.01",
                })[0];

                $(div).append($(baseInput).clone().val(x));
                $(div).append($(baseInput).clone().val(y));

                const button = $("<button>", { class: "Button" })[0];
                $(button).click((event) => this.remove(event));
                $(button).text("-");

                $(div).append(button);

                $(this.parent).find("#matrix").append(div);
            });

            this._setEvents();
        },

        get() {
            let points = [];

            $(this.parent)
                .find("#matrix div")
                .each(function () {
                    let x;
                    let y;

                    $(this)
                        .find("input")
                        .each(function (index) {
                            if (index == 0) {
                                x = parseFloat($(this).val());
                            } else {
                                y = parseFloat($(this).val());
                            }
                        });

                    points.push(new THREE.Vector2(x, y));
                });

            return points;
        },
    };
});
