package com.example.demo.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.DTOs.FotoUpdateDTO;
import com.example.demo.models.FotoImovelModel;
import com.example.demo.services.FotoImovelService;

// Tudo aqui é só do ADMIN (ver SecurityConfig). As fotos de cada imóvel já vêm em GET /imoveis.
// Os erros viram { "mensagem": "..." } pelo ApiExceptionHandler.
@RestController
@RequestMapping("/fotos")
public class FotoImovelController {
    @Autowired
    private FotoImovelService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<FotoImovelModel> salvar(
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam("imovelId") Integer imovelId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.salvar(arquivo, imovelId));
    }

    // Corpo: { "capa": true, "ordem": 0 } (os dois são opcionais)
    @PutMapping("/{id}")
    public ResponseEntity<FotoImovelModel> atualizar(@PathVariable Integer id, @RequestBody FotoUpdateDTO dto) {
        return ResponseEntity.ok(service.atualizar(id, dto.getCapa(), dto.getOrdem()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }
}
