let textureUploader = null;
jQuery(document).ready(function ($) {
    textureUploader = {
        frame: null,

        createUploader({ imageBox, callback, textureLabel, textureType }) {
            let int = null;
            let amount = /cube/i.test(textureType) ? 6 : 1;

            this.frame = wp.media({
                title:
                    amount > 1
                        ? "Selecione para a parte da frente do cubo (x pos.)"
                        : `Selecione ou carregue uma imagem como ${textureLabel}`,
                multiple: amount > 1 ? "add" : false,
                button: {
                    text:
                        amount > 1 ? "Usar estas imagens" : "Usar esta imagem",
                },
            });

            this.frame.on("open", () => {
                int = setInterval(() => {
                    $('[id^="__wp-uploader-id-"]')
                        .filter(function () {
                            return !/display:[\s]*none;/i.test(
                                $(this).attr("style")
                            );
                            // pega o frame que está atualmente aberto
                        })
                        .each(function () {
                            $(this)
                                .find(".media-button.media-button-select")
                                .prop(
                                    "disabled",
                                    $(this).find("li.attachment.selected")
                                        .length !== amount
                                    // desabilita o botão se o usuário selecionar mais ou menos
                                    // arquivos que "amount"
                                );
                        });
                }, 0);
            });

            this.frame.on("selection:toggle", () => {
                if (!/cube/i.test(textureType)) return;

                const attachments = this.frame
                    .state()
                    .get("selection")
                    .toJSON();

                $('[id^="__wp-uploader-id-"]')
                    .filter(function () {
                        return !/display:[\s]*none;/i.test(
                            $(this).attr("style")
                        );
                    })
                    .each(function () {
                        const steps = [
                            "da frente (x pos.)",
                            "de trás (x neg.)",
                            "de cima (y pos.)",
                            "debaixo (y neg.)",
                            "direita (z pos.)",
                            "esquerda (z neg.)",
                        ];
                        const currStep = steps[attachments.length];

                        $(this)
                            .find("#media-frame-title h1")
                            .text(
                                currStep
                                    ? `Selecione para a parte ${currStep} do cubo`
                                    : "Pronto!"
                            );
                    });
            });

            this.frame.on("select", () => {
                const attachments = this.frame
                    .state()
                    .get("selection")
                    .toJSON();

                $(imageBox).css(
                    "background-image",
                    `url("${attachments[0].url}")`
                );

                const allUploads = [];
                attachments.forEach(({ url }) => allUploads.push(url));

                $(imageBox).data("all-uploads", JSON.stringify(allUploads));

                callback(attachments);
            });

            this.frame.on("close", () => clearInterval(int));
        },

        open() {
            this.frame.open();
        },
    };
});
