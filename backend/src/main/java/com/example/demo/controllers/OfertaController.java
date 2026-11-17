package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTOs.AceitarOfertaDTO;
import com.example.demo.DTOs.OfertaRequestDTO;
import com.example.demo.models.OfertaModel;
import com.example.demo.services.OfertaService;

// Permissões (ver SecurityConfig): cliente (USER) cria, lista as suas e cancela;
// corretor (e admin) listam todas; só o corretor aceita (prepara o contrato) e recusa.
@RestController
@RequestMapping("/ofertas")
public class OfertaController {

    private final OfertaService service;

    public OfertaController(OfertaService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<OfertaModel> criar(@RequestBody OfertaRequestDTO dto, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(auth.getName(), dto));
    }

    @GetMapping("/minhas")
    public ResponseEntity<List<OfertaModel>> minhas(Authentication auth) {
        return ResponseEntity.ok(service.minhas(auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<OfertaModel>> todas(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.todas(status));
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<OfertaModel> cancelar(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(service.cancelar(id, auth.getName()));
    }

    // Corpo opcional: { "condicoes": "texto das condições do contrato" }
    @PatchMapping("/{id}/aceitar")
    public ResponseEntity<OfertaModel> aceitar(@PathVariable Integer id,
            @RequestBody(required = false) AceitarOfertaDTO dto) {
        return ResponseEntity.ok(service.aceitar(id, dto == null ? null : dto.getCondicoes()));
    }

    @PatchMapping("/{id}/recusar")
    public ResponseEntity<OfertaModel> recusar(@PathVariable Integer id) {
        return ResponseEntity.ok(service.recusar(id));
    }
}
