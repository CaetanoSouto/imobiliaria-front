package com.example.demo.exceptions;

// Dados inválidos na requisição -> HTTP 400 com {"mensagem": "..."}
public class RequisicaoInvalidaException extends RuntimeException {
    public RequisicaoInvalidaException(String mensagem) {
        super(mensagem);
    }
}
