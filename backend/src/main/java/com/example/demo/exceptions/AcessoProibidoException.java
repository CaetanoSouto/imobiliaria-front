package com.example.demo.exceptions;

// Usuário autenticado mexendo em item de outra pessoa -> HTTP 403 com {"mensagem": "..."}
public class AcessoProibidoException extends RuntimeException {
    public AcessoProibidoException(String mensagem) {
        super(mensagem);
    }
}
