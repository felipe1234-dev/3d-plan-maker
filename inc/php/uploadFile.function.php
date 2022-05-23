<?php
namespace ThreeDPlanMaker;

function uploadFile(string $field_name, string $custom_dir = "/"): array {
    $KB = 1024;
    $MB = 1024*$KB;

    $post_data = isset( $_POST )  ? $_POST  : array();
    $file_data = isset( $_FILES ) ? $_FILES : array();
    $form_data = array_merge( $post_data, $file_data );
    $data      = $form_data[$field_name];
    $resp      = array();
    
    $upload_dir  = wp_upload_dir();
    $upload_path = $upload_dir["basedir"].$custom_dir;
    $upload_url  = $upload_dir["baseurl"].$custom_dir;

    if (!file_exists($upload_path)) {
        mkdir($upload_path);
    }
    
    $filename    = $data["name"];
    $temp_name   = $data["tmp_name"];
    $file_size   = $data["size"]; // Em Bytes
    $file_error  = $data["error"];
    $max_size    = wp_max_upload_size(); // Em Bytes
    $target_path = "$upload_path/$filename";
    
    $resp["filename"]  = $filename;
    $resp["file_size"] = $file_size;
    
    $error_list = array(
        0 => "Não há erro, o arquivo \"$filename\" foi carregado com sucesso.",
        1 => "O arquivo \"$filename\" carregado excede o upload_max_files nas configurações do servidor.",
        2 => "O arquivo \"$filename\" enviado excede o MAX_FILE_SIZE do formulário HTML.",
        3 => "O arquivo \"$filename\" enviado foi carregado apenas parcialmente.",
        4 => "Nenhum arquivo foi carregado.",
        6 => "Faltando uma pasta temporária.",
        7 => "Falha ao gravar arquivo \"$filename\" no disco.",
        8 => "Uma extensão PHP interrompeu o upload do arquivo \"$filename\"."
    );
    
    switch (true) {
        case $file_error > 0:
            $resp["status"]  = "ERROR";
            $resp["message"] = $error_list[$file_error];
            break;
        
        default:
            if ($file_size <= $max_size) {
                if (move_uploaded_file($temp_name, $target_path)) {
                    $resp["status"]  = "SUCCESS";
                    $resp["message"] = "Arquivo carregado com sucesso.";
                    $resp["url"]     = "$upload_url/$filename";
                } else {
                    $resp["status"]  = "ERROR";
                    $resp["message"] = "Erro desonhecido no upload.";
                }
            } else {
                $resp["status"]  = "ERROR";
                $resp["message"] = 'Arquivo "'.$filename.'" é grande demais. 
                    O tamanho máximo de arquivo é '.round($max_size/$MB).' MB, 
                    seu arquivo possui '.round($file_size/$MB).' MB. 
                    Vá até as configurações do seu provedor de hospedagem para alterar
                    ou utilize plugins para isso (como WP Increase Upload Filesize).';
            }
            break;
    }

    return $resp;
}