package com.example.demo.exceptions;

// Item inexistente -> HTTP 404 com {"mensagem": "..."}
public class RecursoNaoEncontradoException extends RuntimeException {
    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
