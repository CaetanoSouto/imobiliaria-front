package com.example.demo.exceptions;

// Violação de regra de negócio -> HTTP 409 com {"mensagem": "..."}
public class RegraNegocioException extends RuntimeException {
    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
