package com.example.demo.exceptions;

import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

// Converte as exceções das regras de negócio em respostas JSON { "mensagem": "..." }.
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<Map<String, String>> regra(RegraNegocioException e) {
        return resposta(HttpStatus.CONFLICT, e);
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<Map<String, String>> naoEncontrado(RecursoNaoEncontradoException e) {
        return resposta(HttpStatus.NOT_FOUND, e);
    }

    @ExceptionHandler(RequisicaoInvalidaException.class)
    public ResponseEntity<Map<String, String>> invalida(RequisicaoInvalidaException e) {
        return resposta(HttpStatus.BAD_REQUEST, e);
    }

    @ExceptionHandler(AcessoProibidoException.class)
    public ResponseEntity<Map<String, String>> proibido(AcessoProibidoException e) {
        return resposta(HttpStatus.FORBIDDEN, e);
    }

    // Excluir algo que ainda é usado por outros dados (chave estrangeira) vira uma mensagem clara.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integridade(DataIntegrityViolationException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("mensagem", "Operação não permitida: este registro está relacionado a outros dados."));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> arquivoGrande(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("mensagem", "A foto é grande demais. O tamanho máximo é 10 MB."));
    }

    private ResponseEntity<Map<String, String>> resposta(HttpStatus status, RuntimeException e) {
        return ResponseEntity.status(status).body(Map.of("mensagem", e.getMessage()));
    }
}
