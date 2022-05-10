<?php
namespace ThreeDPlanMaker;

function loadJSON(string $path, string $format = "array") : array|object {
    if ( !file_exists($path) ) {
        die("Incapaz de converter o JSON de configuração: O caminho ($path) não existe!
            Contate o programador para verificar o que está havendo.");
    }
    
    return json_decode( file_get_contents($path), (bool)preg_match("/array/i", $format) );
}