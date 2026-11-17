package com.example.demo.controllers;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.models.ContratoModel;
import com.example.demo.services.ContratoService;

// Permissões (ver SecurityConfig): cliente (USER) lista os seus e assina;
// corretor e admin listam todos; o admin aprova e cancela.
@RestController
@RequestMapping("/contratos")
public class ContratoController {

    private final ContratoService service;

    public ContratoController(ContratoService service) {
        this.service = service;
    }

    @GetMapping("/meus")
    public ResponseEntity<List<ContratoModel>> meus(Authentication auth) {
        return ResponseEntity.ok(service.meus(auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<ContratoModel>> todos() {
        return ResponseEntity.ok(service.todos());
    }

    // Baixar o PDF. O cliente só baixa o seu (o service confere); corretor e admin, qualquer um.
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Integer id, Authentication auth) {
        boolean funcionario = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_CORRETOR"));
        byte[] pdf = service.pdf(id, auth.getName(), funcionario);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"contrato-" + id + ".pdf\"")
                .body(pdf);
    }

    @PatchMapping("/{id}/aprovar")
    public ResponseEntity<ContratoModel> aprovar(@PathVariable Integer id) {
        return ResponseEntity.ok(service.aprovar(id));
    }

    @PatchMapping("/{id}/assinar")
    public ResponseEntity<ContratoModel> assinar(@PathVariable Integer id, Authentication auth) {
        return ResponseEntity.ok(service.assinar(id, auth.getName()));
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<ContratoModel> cancelar(@PathVariable Integer id) {
        return ResponseEntity.ok(service.cancelar(id));
    }
}
