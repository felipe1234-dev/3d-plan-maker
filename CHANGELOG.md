<h1>Change Log</h1>

<p>Todas as alterações notáveis neste projeto serão documentadas neste arquivo.</p>
<p>Por favor, note que este arquivo pode estar incompleto devido a uma preocupação tardia com a criação de um changelogger.</p>

<style type="text/css">
	.Tag {
    	align-items: center;
        border-radius: .375em;
        display: inline-flex;
        font-size: .75rem;
        height: 2em;
        justify-content: center;
        line-height: 1.5;
        padding-left: .75em;
        padding-right: .75em;
        white-space: nowrap;
        font-weight: 600;
        background-color: #f5f5f5;
        color: #292d33;
    }    
</style>

<style type="text/css">
    .Tag.Removed {
        color: #fff;
        background-color: #f44336;
    }
</style>

<style type="text/css">
    .Tag.Changed {
        color: #fff;
        background-color: #ffca28;
    }
</style>

<style type="text/css">
    .Tag.Added {
        color: #fff;
        background-color: #61e002;
    }
</style>

<style type="text/css">
    .Tag.Fixed {
        color: #fff;
        background-color: #3e8ed0;
    }
</style>

<h2>Mudanças no Código Fonte de Bibliotecas</h2>

<i>2021 - 12 - 21</i>
- <span class="Tag Changed">Mudado</span> Criação de novo escutador de evento nos botões de `zoomIn` e `zoomOut`: agora, é possível aumentar e diminuir o zoom segurando o botão esquerdo do mouse por cima dos botões


<h2>v7.2.0</h2>
<p><i>2022 - 02 - 21</i></p>

- <span class="Tag Added">Adicionado</span> Input para editar o "fator de opacidade" - número pelo qual as opacidades dos materiais das cenas não selecionadas são multiplicados a fim de diminuir seus valores



<h2>v7.1.1</h2>
<p><i>2022 - 02 - 21</i></p>

- <span class="Tag Changed">Mudança</span> A opção do contexto "Editor" foi desabilitada (pois é um contexto reservado)
- <span class="Tag Changed">Mudança</span> Corrigindo o espaçamento interno do select


<h2>v7.1.0</h2>
<p><i>2022 - 02 - 21</i></p>

- <span class="Tag Added">Adicionado</span> Select tag para trocar de contexto

<h2>v7.0.1</h2>
<p><i>2022 - 02 - 21</i></p>

- <span class="Tag Fixed">Bug</span> O editor estava inicializando antes de carregar o modelo, devido a um processo assíncrono que foi convertido em síncrono
- <span class="Tag Fixed">Bug</span> Os atalhos do teclado não estavam funcionando porque os IDs dos inputs (que são usados para configurar os atalhos) no código Javascript e no HTML não estavam iguais
- <span class="Tag Fixed">Bug</span> Corrigindo o método `Editor.Viewport.remove` que não estava des-selecionando o objeto antes de removê-lo
- <span class="Tag">Novidade</span> Início da documentação em código com JSDoc


<h2>v7.0.0</h2>
<p><i>2022 - 02 - 20</i></p>

- <span class="Tag Changed">Mudança</span> Mudança no formato de salvamento do projeto para acomodar o `THREE.HotSpot` e `THREE.HotSpotMaterial`


<h2>v6.2.3</h2>
<p><i>2022 - 02 - 19</i></p>

- <span class="Tag Fixed">Bug</span> Erro no construtor do `THREE.HotSpotMaterial` ao desestruturar (<i>destructure</i>) o objeto de parâmetros - quando alguma propriedade não fora passada, ocorria erro.
- <span class="Tag Changed">Mudança</span> A geometria do `THREE.HotSpot` agora é uma `THREE.CircleGeometry`, seu raio padrão possui uma certa proporção com a largura da `THREE.CanvasTexture` do material para a melhor resolução
- <span class="Tag Removed">Removido</span> Removendo a classe `Trait` e abandonando a ideia

<h2>v6.2.2</h2>
<p><i>2022 - 02 - 18</i></p>

- <span class="Tag Changed">Mudança</span> Convertendo todas as subclasses em "traits"


<h2>v6.2.1</h2>
<p><i>2022 - 02 - 17</i></p>

- <span class="Tag Changed">Mudança</span> Setando o `THREE.Renderer.autoClear` para `false` para renderizar múltiplas cenas no mesmo renderizador.
- <span class="Tag Changed">Mudança</span> O método `new Editor.contexts[name].select` agora deixa objetos fora da cena selecionada com opacidade diminuída.
- <span class="Tag Changed">Mudança</span> Implementação de propriedades privadas (#) em todas as classes

<h2>v6.2.0</h2>
<p><i>2022 - 02 - 17</i></p>
- <span class="Tag Added">Adicionado</span> Criação da classe `Trait` para simular os `Traits` do PHP


<h2>v6.1.0</h2>
<p><i>2022 - 02 - 16</i></p>

- <span class="Tag Added">Adicionado</span> Funcionalidade de contextos no editor (objeto `new Editor.contexts`)


<h2>v6.0.0</h2>
<p><i>2022 - 02 - 16</i></p>

- <span class="Tag Changed">Mudança</span> Mudança drástica no formato de salvamento do projeto para acomodar o `Editor.Contexts`, agora, o projeto de planta 3D tem múltiplas cenas para mostrar coisas específicas, como a instalação elétrica, cômodos, etc.
- <span class="Tag Changed">Mudança</span> O modelo padrão agora conta com um contexto padrão chamado "Planta"

<h2></h2>
<p align="center"><i>Tempo não documentado :( </i></p>
<h2></h2>

<h2>v1.0.0</h2>
<p><i>2021 - 12 - 18</i></p>

- <span class="Tag">Novidade</span> Versão inicial