package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.models.FavoritoModel;
import com.example.demo.services.FavoritoService;

// Favoritos do cliente logado (somente USER, ver SecurityConfig).
@RestController
@RequestMapping("/favoritos")
public class FavoritoController {

    private final FavoritoService service;

    public FavoritoController(FavoritoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<FavoritoModel>> listar(Authentication auth) {
        return ResponseEntity.ok(service.listar(auth.getName()));
    }

    @PostMapping("/{imovelId}")
    public ResponseEntity<FavoritoModel> adicionar(@PathVariable Integer imovelId, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.adicionar(auth.getName(), imovelId));
    }

    @DeleteMapping("/{imovelId}")
    public ResponseEntity<Void> remover(@PathVariable Integer imovelId, Authentication auth) {
        service.remover(auth.getName(), imovelId);
        return ResponseEntity.noContent().build();
    }
}
